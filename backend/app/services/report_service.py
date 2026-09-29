import os
import re
from datetime import datetime, timezone
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
)
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.fonts import addMapping

import arabic_reshaper
from bidi.algorithm import get_display

from app.core.config import settings
from app.models.consultation import (
    Consultation,
    ConsultationReport,
)
from app.models.patient import Patient
from app.models.user import User
from app.models.settings import ClinicSetting


# ==========================================
# FONT REGISTRATION & BILINGUAL UTILITIES
# ==========================================

FONTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "assets", "fonts"))
REGULAR_FONT_PATH = os.path.join(FONTS_DIR, "Tahoma.ttf")
BOLD_FONT_PATH = os.path.join(FONTS_DIR, "Tahoma-Bold.ttf")

FONT_NORMAL = "Helvetica"
FONT_BOLD = "Helvetica-Bold"

try:
    if os.path.exists(REGULAR_FONT_PATH):
        pdfmetrics.registerFont(TTFont("CustomMedical", REGULAR_FONT_PATH))
        FONT_NORMAL = "CustomMedical"

    if os.path.exists(BOLD_FONT_PATH):
        pdfmetrics.registerFont(TTFont("CustomMedical-Bold", BOLD_FONT_PATH))
        FONT_BOLD = "CustomMedical-Bold"

    if FONT_NORMAL == "CustomMedical" and FONT_BOLD == "CustomMedical-Bold":
        addMapping("CustomMedical", 0, 0, "CustomMedical")
        addMapping("CustomMedical", 1, 0, "CustomMedical-Bold")
except Exception as e:
    # Fallback to standard Helvetica if custom font registration fails
    FONT_NORMAL = "Helvetica"
    FONT_BOLD = "Helvetica-Bold"


def format_bilingual(text: Optional[str]) -> str:
    """
    Properly shapes Urdu/Arabic unicode text and applies the Unicode bidirectional (bidi) algorithm.
    Leaves English and numbers untouched or cleanly mixed so English words are never reversed.
    """
    if not text:
        return ""
    text_str = str(text).strip()
    if not text_str:
        return ""

    # Check for Arabic / Urdu unicode range
    has_arabic = bool(re.search(r"[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]", text_str))
    if not has_arabic:
        return text_str

    try:
        reshaped = arabic_reshaper.reshape(text_str)
        return get_display(reshaped)
    except Exception:
        return text_str


# ==========================================
# NUMBERED CANVAS (PAGE X OF Y)
# ==========================================

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas that counts the total number of pages and draws
    a professional running footer with 'Page X of Y' on every page.
    """
    clinic_name = settings.CLINIC_NAME
    clinic_phone = settings.CLINIC_PHONE
    clinic_email = settings.CLINIC_EMAIL

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_footer(num_pages)
            super().showPage()
        super().save()

    def draw_footer(self, total_pages: int):
        self.saveState()
        self.setFont(FONT_NORMAL, 8)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)

        # Draw footer line at y = 38
        self.line(36, 38, 559, 38)

        # Footer Left: Clinic EMR info
        clinic_info = f"Printed from {self.clinic_name} EMR | Contact: {self.clinic_phone} | {self.clinic_email}"
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(36, 26, clinic_info)

        # Footer Right: Page X of Y
        page_str = f"Page {self._pageNumber} of {total_pages}"
        self.drawRightString(559, 26, page_str)

        # Sub-footer line: Validity note
        self.setFont(FONT_NORMAL, 7)
        self.setFillColor(colors.HexColor("#94A3B8"))
        self.drawCentredString(297.5, 15, "Valid only with Doctor's stamp and signature | Electronic Medical Record")
        self.restoreState()


# ==========================================
# PDF GENERATION SERVICE
# ==========================================

NAVY_BLUE = colors.HexColor("#1B365D")
DARK_NAVY = colors.HexColor("#0F2038")
LIGHT_NAVY = colors.HexColor("#2A4D7D")
BORDER_GRAY = colors.HexColor("#CBD5E1")
LIGHT_BG = colors.HexColor("#F8FAFC")
HEADER_BG = colors.HexColor("#F1F5F9")
TEXT_DARK = colors.HexColor("#1E293B")
TEXT_MUTED = colors.HexColor("#475569")
ACCENT_BLUE = colors.HexColor("#2563EB")


def _get_styles():
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Normal"],
        fontName=FONT_BOLD,
        fontSize=15,
        leading=18,
        alignment=1,  # Centered
        textColor=NAVY_BLUE,
    )

    clinic_title_style = ParagraphStyle(
        "ClinicTitle",
        parent=styles["Normal"],
        fontName=FONT_BOLD,
        fontSize=14,
        leading=17,
        textColor=NAVY_BLUE,
    )

    clinic_sub_style = ParagraphStyle(
        "ClinicSub",
        parent=styles["Normal"],
        fontName=FONT_NORMAL,
        fontSize=8,
        leading=11,
        textColor=TEXT_MUTED,
    )

    doc_header_style = ParagraphStyle(
        "DocHeader",
        parent=styles["Normal"],
        fontName=FONT_BOLD,
        fontSize=10,
        leading=13,
        textColor=TEXT_DARK,
    )

    doc_sub_style = ParagraphStyle(
        "DocSub",
        parent=styles["Normal"],
        fontName=FONT_NORMAL,
        fontSize=8,
        leading=11,
        textColor=TEXT_MUTED,
    )

    section_banner_style = ParagraphStyle(
        "SectionBanner",
        parent=styles["Normal"],
        fontName=FONT_BOLD,
        fontSize=9,
        leading=11,
        textColor=colors.white,
    )

    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName=FONT_BOLD,
        fontSize=8.5,
        leading=11,
        alignment=0,
        textColor=NAVY_BLUE,
    )

    table_cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName=FONT_NORMAL,
        fontSize=8,
        leading=11,
        textColor=TEXT_DARK,
    )

    table_cell_bold_style = ParagraphStyle(
        "TableCellBold",
        parent=styles["Normal"],
        fontName=FONT_BOLD,
        fontSize=8,
        leading=11,
        textColor=TEXT_DARK,
    )

    info_label_style = ParagraphStyle(
        "InfoLabel",
        parent=styles["Normal"],
        fontName=FONT_BOLD,
        fontSize=8,
        leading=11,
        textColor=TEXT_DARK,
    )

    info_value_style = ParagraphStyle(
        "InfoValue",
        parent=styles["Normal"],
        fontName=FONT_NORMAL,
        fontSize=8,
        leading=11,
        textColor=TEXT_DARK,
    )

    return {
        "title": title_style,
        "clinic_title": clinic_title_style,
        "clinic_sub": clinic_sub_style,
        "doc_header": doc_header_style,
        "doc_sub": doc_sub_style,
        "section_banner": section_banner_style,
        "table_header": table_header_style,
        "table_cell": table_cell_style,
        "table_cell_bold": table_cell_bold_style,
        "info_label": info_label_style,
        "info_value": info_value_style,
    }


def _build_clinic_header(styles: dict, clinic_cfg=None) -> Table:
    """
    Builds the top Doctor/Clinic header inspired by reference image.
    Left: Clinic & Doctor info (with optional Logo).
    Right: Contact Phone, Email, Address.
    """
    c_name = getattr(clinic_cfg, "clinic_name", settings.CLINIC_NAME)
    c_name_urdu = getattr(clinic_cfg, "clinic_name_urdu", settings.CLINIC_NAME_URDU)
    c_subtitle = getattr(clinic_cfg, "clinic_subtitle", settings.CLINIC_SUBTITLE)
    d_name = getattr(clinic_cfg, "doctor_name", settings.DOCTOR_NAME)
    d_name_urdu = getattr(clinic_cfg, "doctor_name_urdu", settings.DOCTOR_NAME_URDU)
    d_spec = getattr(clinic_cfg, "specialization", settings.DOCTOR_SPECIALIZATION)
    d_spec_urdu = getattr(clinic_cfg, "specialization_urdu", settings.DOCTOR_SPECIALIZATION_URDU)
    d_qual = getattr(clinic_cfg, "qualifications", settings.DOCTOR_QUALIFICATIONS)
    reg_no = getattr(clinic_cfg, "registration_no", settings.DOCTOR_REGISTRATION_NO)
    phone = getattr(clinic_cfg, "clinic_phone", settings.CLINIC_PHONE)
    email = getattr(clinic_cfg, "clinic_email", settings.CLINIC_EMAIL)
    address = getattr(clinic_cfg, "clinic_address", settings.CLINIC_ADDRESS)
    logo_path = getattr(clinic_cfg, "logo_path", settings.CLINIC_LOGO_PATH)

    doc_urdu = format_bilingual(d_name_urdu)
    clinic_urdu = format_bilingual(c_name_urdu)
    specialization_urdu = format_bilingual(d_spec_urdu)

    left_content = []

    # If logo exists, render side-by-side with clinic name
    if logo_path and os.path.exists(logo_path):
        try:
            from reportlab.platypus import Image as RLImage
            logo_img = RLImage(logo_path, width=42, height=42)
            brand_box = Table(
                [[
                    logo_img,
                    [
                        Paragraph(f"<b>{c_name}</b> {f'({clinic_urdu})' if clinic_urdu else ''}", styles["clinic_title"]),
                        Paragraph(f"{c_subtitle}", styles["clinic_sub"]) if c_subtitle else Paragraph("", styles["clinic_sub"]),
                    ]
                ]],
                colWidths=[48, 282]
            )
            brand_box.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]))
            left_content.append(brand_box)
        except Exception:
            left_content.append(Paragraph(f"<b>{c_name}</b> {f'({clinic_urdu})' if clinic_urdu else ''}", styles["clinic_title"]))
            if c_subtitle:
                left_content.append(Paragraph(f"{c_subtitle}", styles["clinic_sub"]))
    else:
        left_content.append(Paragraph(f"<b>{c_name}</b> {f'({clinic_urdu})' if clinic_urdu else ''}", styles["clinic_title"]))
        if c_subtitle:
            left_content.append(Paragraph(f"{c_subtitle}", styles["clinic_sub"]))

    left_content.extend([
        Spacer(1, 4),
        Paragraph(f"<b>{d_name}</b> {f'({doc_urdu})' if doc_urdu else ''}", styles["doc_header"]),
        Paragraph(f"{d_spec} {f'| {specialization_urdu}' if specialization_urdu else ''} — {d_qual}", styles["doc_sub"]),
    ])

    right_content = [
        Paragraph(f"<b>Phone:</b> {phone}", styles["doc_sub"]),
        Paragraph(f"<b>Email:</b> {email}", styles["doc_sub"]),
        Paragraph(f"<b>Address:</b> {address}", styles["doc_sub"]),
        Paragraph(f"<b>PMC Reg:</b> {reg_no}", styles["doc_sub"]) if reg_no else Paragraph("", styles["doc_sub"]),
    ]

    header_table = Table(
        [[left_content, right_content]],
        colWidths=[330, 193],
    )
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return header_table


def _build_section_banner(title_english: str, title_urdu: Optional[str], styles: dict) -> Table:
    """
    Builds a full-width dark navy banner for section headings, e.g.
    'PRESCRIPTION / تجویز کردہ ادویات'
    """
    urdu_part = f" / {format_bilingual(title_urdu)}" if title_urdu else ""
    full_text = f"{title_english}{urdu_part}"
    banner_p = Paragraph(f"<b>{full_text}</b>", styles["section_banner"])

    table = Table([[banner_p]], colWidths=[523])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY_BLUE),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return table


def _build_patient_info_table(consultation: Consultation, styles: dict) -> Table:
    """
    Builds the Doctor & Patient information grid.
    Only fields that exist are shown. CNIC is hidden if empty.
    """
    patient: Optional[Patient] = consultation.patient
    doctor_name = consultation.doctor.full_name if consultation.doctor else settings.DOCTOR_NAME

    c_date = consultation.consultation_date.strftime("%d %b %Y")
    c_time = consultation.consultation_date.strftime("%I:%M %p")

    patient_name = patient.full_name if patient else "N/A"
    patient_id = patient.patient_id if patient else f"ID-{consultation.patient_id}"
    patient_age = f"{patient.age} Yrs" if patient and patient.age else "—"
    patient_gender = patient.gender.value if (patient and hasattr(patient.gender, 'value')) else str(patient.gender) if patient else "—"
    patient_mobile = patient.mobile_number if (patient and patient.mobile_number) else "—"
    patient_cnic = patient.cnic if (patient and patient.cnic) else None

    # Row 1: Doctor Info (Left) | Consultation Date & Time (Right)
    r1_col1 = Paragraph(f"<b>Doctor:</b> {doctor_name}", styles["info_value"])
    r1_col2 = Paragraph(f"<b>Date:</b> {c_date}&nbsp;&nbsp;&nbsp;&nbsp;<b>Time:</b> {c_time}", styles["info_value"])

    # Row 2: Patient Name & ID
    r2_col1 = Paragraph(f"<b>Patient Name:</b> {patient_name}", styles["info_value"])
    r2_col2 = Paragraph(f"<b>Patient ID:</b> {patient_id}", styles["info_value"])

    # Row 3: Demographics
    r3_data = [
        Paragraph(f"<b>Age:</b> {patient_age}", styles["info_value"]),
        Paragraph(f"<b>Gender:</b> {patient_gender}", styles["info_value"]),
        Paragraph(f"<b>Mobile:</b> {patient_mobile}", styles["info_value"]),
    ]
    if patient_cnic:
        r3_data.append(Paragraph(f"<b>CNIC:</b> {patient_cnic}", styles["info_value"]))

    # Table layout
    if patient_cnic:
        # 4 items in row 3: [100, 100, 160, 163]
        row3 = r3_data
        col_widths = [100, 100, 160, 163]
    else:
        # 3 items in row 3: [120, 120, 283]
        row3 = r3_data
        col_widths = [120, 120, 283]

    table_data = [
        [r1_col1, r1_col2],
        [r2_col1, r2_col2],
    ]

    # Combine into a 2-column or unified grid
    # To keep uniform column borders:
    grid_rows = [
        [
            Paragraph(f"<b>Doctor:</b> {doctor_name}", styles["info_value"]),
            "",
            Paragraph(f"<b>Date:</b> {c_date}&nbsp;&nbsp;&nbsp;<b>Time:</b> {c_time}", styles["info_value"]),
            "",
        ],
        [
            Paragraph(f"<b>Patient Name:</b> {patient_name}", styles["info_value"]),
            "",
            Paragraph(f"<b>Patient ID:</b> {patient_id}", styles["info_value"]),
            "",
        ],
        [
            Paragraph(f"<b>Age:</b> {patient_age}", styles["info_value"]),
            Paragraph(f"<b>Gender:</b> {patient_gender}", styles["info_value"]),
            Paragraph(f"<b>Mobile:</b> {patient_mobile}", styles["info_value"]),
            Paragraph(f"<b>CNIC:</b> {patient_cnic}", styles["info_value"]) if patient_cnic else Paragraph(f"<b>Consultation ID:</b> {consultation.consultation_id}", styles["info_value"]),
        ]
    ]

    info_table = Table(
        grid_rows,
        colWidths=[130, 130, 130, 133],
    )
    info_table.setStyle(TableStyle([
        ("SPAN", (0, 0), (1, 0)),
        ("SPAN", (2, 0), (3, 0)),
        ("SPAN", (0, 1), (1, 1)),
        ("SPAN", (2, 1), (3, 1)),
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return info_table


def _build_symptoms_section(consultation: Consultation, styles: dict) -> Optional[List]:
    """
    Builds the Symptoms section.
    Returns None if no symptoms and no symptom notes exist.
    """
    has_symptoms = bool(consultation.symptoms)
    has_notes = bool(consultation.symptom_notes and consultation.symptom_notes.strip())

    if not has_symptoms and not has_notes:
        return None

    elements = []
    elements.append(_build_section_banner("SYMPTOMS", "علامات", styles))

    symptom_items = []
    if has_symptoms:
        for s in consultation.symptoms:
            name = s.symptom_name
            cat = f" ({s.category})" if s.category and s.category != "General" else ""
            notes = f" — {s.notes}" if s.notes else ""
            symptom_items.append(f"• <b>{format_bilingual(name)}</b>{cat}{format_bilingual(notes)}")

    symptoms_str = " &nbsp;&nbsp;&nbsp;&nbsp; ".join(symptom_items) if symptom_items else ""

    content_cells = []
    if symptoms_str:
        content_cells.append([Paragraph(symptoms_str, styles["table_cell"])])

    if has_notes:
        notes_p = Paragraph(f"<b>Clinical Observation:</b> {format_bilingual(consultation.symptom_notes)}", styles["table_cell"])
        content_cells.append([notes_p])

    table = Table(content_cells, colWidths=[523])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    elements.append(table)
    return elements


def _build_vitals_section(consultation: Consultation, styles: dict) -> Optional[List]:
    """
    Builds the Vitals section.
    Only values that are actually recorded are displayed.
    If no vitals recorded, returns None (hides entire section).
    """
    vitals = consultation.vitals
    if not vitals:
        return None

    items = []
    if vitals.systolic_bp is not None and vitals.diastolic_bp is not None:
        items.append(("BP", f"{vitals.systolic_bp}/{vitals.diastolic_bp} mmHg"))
    elif vitals.systolic_bp is not None:
        items.append(("BP (Systolic)", f"{vitals.systolic_bp} mmHg"))

    if vitals.pulse_rate is not None:
        items.append(("Pulse Rate", f"{vitals.pulse_rate} bpm"))

    if vitals.temperature is not None:
        items.append(("Temperature", f"{vitals.temperature} °C"))

    if vitals.oxygen_saturation is not None:
        items.append(("Oxygen (SpO2)", f"{vitals.oxygen_saturation}%"))

    if vitals.nihss_score is not None:
        items.append(("NIHSS Score", f"{vitals.nihss_score}"))

    if getattr(vitals, "fall_risk_assessment", None):
        items.append(("Fall Risk", str(vitals.fall_risk_assessment)))

    if not items:
        return None

    elements = []
    elements.append(_build_section_banner("VITALS", "وائٹل سائنز", styles))

    # Lay out items in columns (up to 4 items per row)
    row_cells = []
    current_row = []
    col_width = 523 / min(len(items), 4) if items else 130.75

    col_widths = []
    num_cols = min(len(items), 4)
    for _ in range(num_cols):
        col_widths.append(523 / num_cols)

    for idx, (label, val) in enumerate(items):
        cell_p = Paragraph(f"<b>{label}:</b> {val}", styles["table_cell"])
        current_row.append(cell_p)
        if len(current_row) == num_cols:
            row_cells.append(current_row)
            current_row = []

    if current_row:
        while len(current_row) < num_cols:
            current_row.append(Paragraph("", styles["table_cell"]))
        row_cells.append(current_row)

    table = Table(row_cells, colWidths=col_widths)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(table)
    return elements


def _build_neurological_exam_section(consultation: Consultation, styles: dict) -> Optional[List]:
    """
    Builds the Neurological Examination section.
    Only examinations with saved findings are shown.
    Also incorporates power_text, mmse_score, and gcs_score if present.
    If no examination data exists, returns None.
    """
    exam_rows = []

    # Individual exam findings
    if consultation.examinations:
        for exam in consultation.examinations:
            finding = exam.finding
            if finding or exam.observation:
                val = finding or ""
                if exam.observation:
                    val = f"{val} ({exam.observation})" if val else exam.observation
                exam_rows.append((f"{exam.category} - {exam.item_name}", val))

    # Power field
    if consultation.power_text and consultation.power_text.strip():
        exam_rows.append(("Power", consultation.power_text.strip()))

    # MMSE and GCS scores
    if consultation.mmse_score is not None:
        exam_rows.append(("Mental Status (MMSE)", f"{consultation.mmse_score} / 30"))
    if consultation.gcs_score is not None:
        exam_rows.append(("Glasgow Coma Scale (GCS)", f"{consultation.gcs_score} / 15"))

    # Additional observations
    if consultation.additional_observations and consultation.additional_observations.strip():
        exam_rows.append(("Exam Observations", consultation.additional_observations.strip()))

    if not exam_rows:
        return None

    elements = []
    elements.append(_build_section_banner("NEUROLOGICAL EXAMINATION", "اعصابی معائنہ", styles))

    # Lay out in a clean 2-column key-value grid (Left Column: Key-Value, Right Column: Key-Value)
    grid_data = []
    i = 0
    while i < len(exam_rows):
        item1_k, item1_v = exam_rows[i]
        c1 = Paragraph(f"<b>{format_bilingual(item1_k)}:</b> {format_bilingual(item1_v)}", styles["table_cell"])
        c2 = Paragraph("", styles["table_cell"])

        if i + 1 < len(exam_rows):
            item2_k, item2_v = exam_rows[i + 1]
            c2 = Paragraph(f"<b>{format_bilingual(item2_k)}:</b> {format_bilingual(item2_v)}", styles["table_cell"])

        grid_data.append([c1, c2])
        i += 2

    table = Table(grid_data, colWidths=[261.5, 261.5])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    elements.append(table)
    return elements


def _build_diagnostic_tests_section(consultation: Consultation, styles: dict) -> Optional[List]:
    """
    Builds the Diagnostic Tests section.
    Only tests that exist are shown.
    If none exist, returns None.
    """
    tests = consultation.diagnostic_tests
    if not tests:
        return None

    elements = []
    elements.append(_build_section_banner("DIAGNOSTIC TESTS", "تشخیصی ٹیسٹ", styles))

    header_row = [
        Paragraph("<b>#</b>", styles["table_header"]),
        Paragraph("<b>Test Name</b>", styles["table_header"]),
        Paragraph("<b>Category / Indication</b>", styles["table_header"]),
        Paragraph("<b>Status</b>", styles["table_header"]),
        Paragraph("<b>Findings / Result</b>", styles["table_header"]),
    ]

    data_rows = [header_row]
    for idx, t in enumerate(tests, 1):
        cat_indication = t.category or ""
        if t.clinical_indication:
            cat_indication = f"{cat_indication} | {t.clinical_indication}" if cat_indication else t.clinical_indication

        res = t.result or "Pending"
        if t.doctor_notes:
            res = f"{res}\nNotes: {t.doctor_notes}"
        if t.result_date:
            res = f"{res} ({t.result_date.strftime('%d %b %Y')})"

        data_rows.append([
            Paragraph(str(idx), styles["table_cell"]),
            Paragraph(f"<b>{format_bilingual(t.test_name)}</b>", styles["table_cell"]),
            Paragraph(format_bilingual(cat_indication) if cat_indication else "—", styles["table_cell"]),
            Paragraph(t.status, styles["table_cell"]),
            Paragraph(format_bilingual(res), styles["table_cell"]),
        ])

    table = Table(data_rows, colWidths=[25, 120, 130, 65, 183], repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), HEADER_BG),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    elements.append(table)
    return elements


def _build_clinical_information_section(consultation: Consultation, styles: dict) -> Optional[List]:
    """
    Builds the Clinical Information section (Assessment, Additional Exam, Treatment Plan).
    Only fields that exist are shown.
    If all are empty, returns None.
    """
    has_desc = bool(consultation.clinical_description and consultation.clinical_description.strip())
    has_exam = bool(consultation.additional_examination and consultation.additional_examination.strip())
    has_plan = bool(consultation.treatment_plan and consultation.treatment_plan.strip())

    if not has_desc and not has_exam and not has_plan:
        return None

    elements = []
    elements.append(_build_section_banner("CLINICAL INFORMATION & ADVICE", "طبی معلومات اور مشورہ", styles))

    rows = []
    if has_desc:
        rows.append([Paragraph(f"<b>Clinical Assessment:</b> {format_bilingual(consultation.clinical_description)}", styles["table_cell"])])

    if has_exam:
        rows.append([Paragraph(f"<b>Additional Examination:</b> {format_bilingual(consultation.additional_examination)}", styles["table_cell"])])

    if has_plan:
        rows.append([Paragraph(f"<b>Treatment Plan / Advice:</b> {format_bilingual(consultation.treatment_plan)}", styles["table_cell"])])

    table = Table(rows, colWidths=[523])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    elements.append(table)
    return elements


def _build_prescription_section(consultation: Consultation, styles: dict) -> Optional[List]:
    """
    Builds the Prescription table.
    Section 18 layout:
    # | Medicine | Dosage | Frequency (Urdu/Eng) | Duration | Instructions (Urdu/Eng)
    Supports Urdu, mixed English/Urdu, text wrapping, and repeating headers on multi-page breaks.
    If no prescription items exist, returns None.
    """
    prescriptions = consultation.prescriptions
    if not prescriptions:
        return None

    elements = []
    elements.append(_build_section_banner("PRESCRIPTION", "تجویز کردہ ادویات", styles))

    header_row = [
        Paragraph("<b>S#</b>", styles["table_header"]),
        Paragraph("<b>Medicine Name</b>", styles["table_header"]),
        Paragraph("<b>Dosage</b>", styles["table_header"]),
        Paragraph("<b>Frequency</b>", styles["table_header"]),
        Paragraph("<b>Duration</b>", styles["table_header"]),
        Paragraph("<b>Instructions</b>", styles["table_header"]),
    ]

    data_rows = [header_row]
    for idx, rx in enumerate(prescriptions, 1):
        med_p = Paragraph(f"<b>{format_bilingual(rx.medicine_name)}</b>", styles["table_cell"])
        dosage_p = Paragraph(format_bilingual(rx.dosage), styles["table_cell"])
        freq_p = Paragraph(format_bilingual(rx.frequency_name), styles["table_cell"])
        dur_p = Paragraph(f"{rx.duration_days} Days", styles["table_cell"])

        instructions = rx.instruction_name or ""
        if rx.custom_instruction:
            instructions = f"{instructions} ({rx.custom_instruction})" if instructions else rx.custom_instruction
        inst_p = Paragraph(format_bilingual(instructions) if instructions else "—", styles["table_cell"])

        data_rows.append([
            Paragraph(str(idx), styles["table_cell"]),
            med_p,
            dosage_p,
            freq_p,
            dur_p,
            inst_p,
        ])

    # Widths sum = 25 + 145 + 65 + 85 + 55 + 148 = 523
    table = Table(data_rows, colWidths=[25, 145, 65, 85, 55, 148], repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), HEADER_BG),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    elements.append(table)
    return elements


def _build_follow_up_section(consultation: Consultation, styles: dict) -> Optional[List]:
    """
    Builds the Follow-Up section.
    If no follow-up information exists, returns None.
    """
    has_date = bool(consultation.follow_up_date)
    has_period = bool(consultation.follow_up_period and consultation.follow_up_period.strip())
    has_inst = bool(consultation.follow_up_instructions and consultation.follow_up_instructions.strip())

    if not has_date and not has_period and not has_inst:
        return None

    elements = []
    elements.append(_build_section_banner("FOLLOW-UP", "فالو اَپ", styles))

    parts = []
    if has_date:
        parts.append(f"<b>Follow-Up Date:</b> {consultation.follow_up_date.strftime('%d %b %Y')}")
    if has_period:
        parts.append(f"<b>Follow-Up Period:</b> {format_bilingual(consultation.follow_up_period)}")

    header_text = "&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;".join(parts)
    rows = []
    if header_text:
        rows.append([Paragraph(header_text, styles["table_cell"])])

    if has_inst:
        rows.append([Paragraph(f"<b>Instructions:</b> {format_bilingual(consultation.follow_up_instructions)}", styles["table_cell"])])

    table = Table(rows, colWidths=[523])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(table)
    return elements


def _build_signature_block(consultation: Consultation, styles: dict, clinic_cfg=None) -> Table:
    """
    Builds the Doctor's Signature & Validity block.
    """
    default_doc = getattr(clinic_cfg, "doctor_name", settings.DOCTOR_NAME)
    default_spec = getattr(clinic_cfg, "specialization", settings.DOCTOR_SPECIALIZATION)
    doc_name = consultation.doctor.full_name if consultation.doctor else default_doc
    doc_title = default_spec

    validity_p = Paragraph("<b>VALID FOR 1 MONTH FROM CONSULTATION DATE</b>", styles["doc_sub"])
    sig_content = [
        Paragraph("___________________________________", styles["info_value"]),
        Paragraph("<b>Doctor's Signature & Stamp</b>", styles["info_label"]),
        Paragraph(f"<b>{doc_name}</b>", styles["info_value"]),
        Paragraph(f"{doc_title}", styles["doc_sub"]),
    ]

    sig_table = Table([[validity_p, sig_content]], colWidths=[261.5, 261.5])
    sig_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return sig_table


# ==========================================
# REPORT COMPILATION & FILE STORAGE
# ==========================================

def compile_prescription_pdf(
    consultation: Consultation,
    output_path: str,
    clinic_cfg=None,
) -> int:
    """
    Compiles the complete A4 prescription report to output_path using ReportLab Platypus.
    Returns the file size in bytes.
    """
    styles = _get_styles()

    # Configure Running Footer EMR details from clinic configuration
    if clinic_cfg:
        NumberedCanvas.clinic_name = getattr(clinic_cfg, "clinic_name", settings.CLINIC_NAME)
        NumberedCanvas.clinic_phone = getattr(clinic_cfg, "clinic_phone", settings.CLINIC_PHONE)
        NumberedCanvas.clinic_email = getattr(clinic_cfg, "clinic_email", settings.CLINIC_EMAIL)

    # Document margins: 36 pt (0.5 inch) left/right/top/bottom
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=45,  # Space for running footer
    )

    story = []

    # 1. Clinic & Doctor Header
    story.append(_build_clinic_header(styles, clinic_cfg=clinic_cfg))
    story.append(Spacer(1, 4))

    # Top visual rule
    story.append(HRFlowable(width="100%", thickness=1.5, color=NAVY_BLUE, spaceBefore=2, spaceAfter=4))

    # 2. Prescription Report Title
    urdu_title = format_bilingual("نسخہ رپورٹ")
    title_text = f"PRESCRIPTION REPORT / {urdu_title}"
    story.append(Paragraph(f"<b>{title_text}</b>", styles["title"]))
    story.append(Spacer(1, 6))

    # 3. Doctor & Patient Information (Always Present)
    story.append(_build_patient_info_table(consultation, styles))
    story.append(Spacer(1, 6))

    # 4. Symptoms (Only if exists)
    symptoms_flowable = _build_symptoms_section(consultation, styles)
    if symptoms_flowable:
        story.extend(symptoms_flowable)
        story.append(Spacer(1, 6))

    # 5. Vital Signs (Only if exists)
    vitals_flowable = _build_vitals_section(consultation, styles)
    if vitals_flowable:
        story.extend(vitals_flowable)
        story.append(Spacer(1, 6))

    # 6. Neurological Examination (Only if exists)
    neuro_flowable = _build_neurological_exam_section(consultation, styles)
    if neuro_flowable:
        story.extend(neuro_flowable)
        story.append(Spacer(1, 6))

    # 7. Diagnostic Tests (Only if exists)
    tests_flowable = _build_diagnostic_tests_section(consultation, styles)
    if tests_flowable:
        story.extend(tests_flowable)
        story.append(Spacer(1, 6))

    # 8. Clinical Information (Only if exists)
    clinical_flowable = _build_clinical_information_section(consultation, styles)
    if clinical_flowable:
        story.extend(clinical_flowable)
        story.append(Spacer(1, 6))

    # 9. Prescription (Only if exists)
    rx_flowable = _build_prescription_section(consultation, styles)
    if rx_flowable:
        story.extend(rx_flowable)
        story.append(Spacer(1, 6))

    # 10. Follow-Up (Only if exists)
    follow_up_flowable = _build_follow_up_section(consultation, styles)
    if follow_up_flowable:
        story.extend(follow_up_flowable)
        story.append(Spacer(1, 6))

    # 11. Signature Block (Kept together to avoid splitting)
    story.append(KeepTogether([
        _build_signature_block(consultation, styles, clinic_cfg=clinic_cfg)
    ]))

    # Build document using NumberedCanvas for true Page X of Y
    doc.build(story, canvasmaker=NumberedCanvas)

    return os.path.getsize(output_path)


def generate_or_retrieve_report(
    db: Session,
    consultation: Consultation,
    user_id: Optional[int] = None,
    force_regenerate: bool = False,
) -> ConsultationReport:
    """
    Retrieves the existing stored report for the consultation, or generates a new one.
    If force_regenerate is True, increments the version and creates a new PDF, updating is_latest flag.
    Guarantees permanent disk persistence and database record.
    """
    patient: Optional[Patient] = consultation.patient
    patient_id_str = patient.patient_id if patient else f"PT-{consultation.patient_id:06d}"
    c_date_str = consultation.consultation_date.strftime("%Y-%m-%d")

    # Check for existing latest report
    existing_reports = (
        db.query(ConsultationReport)
        .filter(ConsultationReport.consultation_id == consultation.id)
        .order_by(desc(ConsultationReport.version))
        .all()
    )

    latest_report = next((r for r in existing_reports if r.is_latest), None)

    # If report already exists and we are not forcing a new version, verify file exists and return it
    if latest_report and not force_regenerate:
        if os.path.exists(latest_report.storage_path):
            return latest_report

    # Prepare storage directory
    storage_root = os.path.abspath(settings.REPORT_STORAGE_PATH)
    consultation_dir = os.path.join(storage_root, f"consultation_{consultation.id}")
    os.makedirs(consultation_dir, exist_ok=True)

    # Determine version number
    version = 1
    if existing_reports:
        version = max(r.version for r in existing_reports) + (1 if force_regenerate else 0)

    # Determine filename (e.g. Prescription_PT-000001_2026-09-29.pdf or _v2.pdf)
    if version == 1:
        file_name = f"Prescription_{patient_id_str}_{c_date_str}.pdf"
    else:
        file_name = f"Prescription_{patient_id_str}_{c_date_str}_v{version}.pdf"

    output_path = os.path.join(consultation_dir, file_name)

    # Mark existing reports as not latest if generating new version
    if force_regenerate and existing_reports:
        for r in existing_reports:
            r.is_latest = False

    # Fetch latest clinic settings if available
    clinic_cfg = db.query(ClinicSetting).first()

    # Generate PDF file
    file_size = compile_prescription_pdf(consultation, output_path, clinic_cfg=clinic_cfg)

    # Unique report ID: RPT-CNS-YYYYMMDD-XXXX-vX
    report_unique_id = f"RPT-{consultation.consultation_id}-v{version}"

    # Check if a report with this exact report_id already exists (e.g. regenerating same version)
    existing_record = db.query(ConsultationReport).filter(ConsultationReport.report_id == report_unique_id).first()

    now = datetime.now(timezone.utc)
    if existing_record:
        existing_record.file_name = file_name
        existing_record.storage_path = output_path
        existing_record.file_size = file_size
        existing_record.is_latest = True
        existing_record.generated_by_id = user_id
        existing_record.updated_at = now
        db.commit()
        db.refresh(existing_record)
        return existing_record
    else:
        report_record = ConsultationReport(
            report_id=report_unique_id,
            consultation_id=consultation.id,
            patient_id=consultation.patient_id,
            file_name=file_name,
            storage_path=output_path,
            document_type="Prescription Report",
            file_size=file_size,
            version=version,
            is_latest=True,
            generated_by_id=user_id,
            created_at=now,
            updated_at=now,
        )
        db.add(report_record)
        db.commit()
        db.refresh(report_record)
        return report_record
