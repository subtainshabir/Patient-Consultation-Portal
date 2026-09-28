import logging
from sqlalchemy.orm import Session
from app.models.master_data import (
    Symptom,
    PatientState,
    NeurologicalExamOption,
    DiagnosticTest,
    Medicine,
    MedicineFrequency,
    MedicineDosage,
    MedicineInstruction,
    FollowUpOption,
)

logger = logging.getLogger("master_data_seeder")


def seed_clinical_master_data(db: Session) -> dict:
    """
    Seeds comprehensive, standardized, and generic clinical master data.
    Ensures idempotency by checking existing records before insertion.
    """
    counts = {}

    # -------------------------------------------------------------
    # 1. Symptoms Seed Data
    # -------------------------------------------------------------
    symptoms_data = [
        # General Neurological
        {"name": "Headache", "category": "General", "sort_order": 1},
        {"name": "Dizziness", "category": "General", "sort_order": 2},
        {"name": "Vertigo", "category": "Vestibular", "sort_order": 3},
        {"name": "Seizure", "category": "General", "sort_order": 4},
        {"name": "Loss of consciousness", "category": "General", "sort_order": 5},
        {"name": "Weakness", "category": "Motor", "sort_order": 6},
        {"name": "Numbness", "category": "Sensory", "sort_order": 7},
        {"name": "Tingling / Paresthesia", "category": "Sensory", "sort_order": 8},
        {"name": "Tremor", "category": "Motor", "sort_order": 9},
        {"name": "Memory problems", "category": "Cognitive", "sort_order": 10},
        {"name": "Confusion", "category": "Cognitive", "sort_order": 11},
        {"name": "Speech difficulty", "category": "Speech", "sort_order": 12},
        {"name": "Difficulty walking", "category": "Motor", "sort_order": 13},
        {"name": "Balance problems", "category": "Vestibular", "sort_order": 14},
        {"name": "Visual disturbance", "category": "Visual", "sort_order": 15},
        {"name": "Double vision (Diplopia)", "category": "Visual", "sort_order": 16},
        {"name": "Facial weakness", "category": "Cranial Nerve", "sort_order": 17},
        {"name": "Difficulty swallowing (Dysphagia)", "category": "Cranial Nerve", "sort_order": 18},
        {"name": "Hearing difficulty", "category": "Cranial Nerve", "sort_order": 19},
        {"name": "Fatigue", "category": "General", "sort_order": 20},
        # Stroke-related
        {"name": "Sudden weakness", "category": "Stroke-related", "sort_order": 21},
        {"name": "Sudden numbness", "category": "Stroke-related", "sort_order": 22},
        {"name": "Facial drooping", "category": "Stroke-related", "sort_order": 23},
        {"name": "Sudden vision loss", "category": "Stroke-related", "sort_order": 24},
        {"name": "Sudden severe headache (Thunderclap)", "category": "Stroke-related", "sort_order": 25},
        {"name": "Sudden loss of balance", "category": "Stroke-related", "sort_order": 26},
        {"name": "Sudden confusion", "category": "Stroke-related", "sort_order": 27},
        # Pain-related
        {"name": "Head pain", "category": "Pain", "sort_order": 28},
        {"name": "Neck pain", "category": "Pain", "sort_order": 29},
        {"name": "Back pain", "category": "Pain", "sort_order": 30},
        {"name": "Limb pain", "category": "Pain", "sort_order": 31},
        {"name": "Facial pain", "category": "Pain", "sort_order": 32},
        {"name": "Sciatica / Radicular pain", "category": "Pain", "sort_order": 33},
    ]
    added_symptoms = 0
    for s in symptoms_data:
        if not db.query(Symptom).filter(Symptom.name == s["name"]).first():
            db.add(Symptom(**s))
            added_symptoms += 1
    counts["symptoms"] = added_symptoms

    # -------------------------------------------------------------
    # 2. Patient States Seed Data
    # -------------------------------------------------------------
    states_data = [
        {"name": "Stable", "description": "Patient condition is balanced and non-critical.", "sort_order": 1},
        {"name": "Improving", "description": "Clinical progression is favorable.", "sort_order": 2},
        {"name": "Worsening", "description": "Symptoms show clinical deterioration.", "sort_order": 3},
        {"name": "Acute", "description": "Recent sudden onset requiring rapid evaluation.", "sort_order": 4},
        {"name": "Chronic", "description": "Long-standing neurological condition.", "sort_order": 5},
        {"name": "Recurrent", "description": "Episodic relapse or repeated clinical presentation.", "sort_order": 6},
        {"name": "Post-operative", "description": "Follow-up following neurosurgical or spinal intervention.", "sort_order": 7},
        {"name": "Post-stroke", "description": "Subacute or chronic rehabilitation post-cerebrovascular event.", "sort_order": 8},
        {"name": "Follow-up", "description": "Routine scheduled clinical review.", "sort_order": 9},
        {"name": "Emergency", "description": "Urgent critical clinical state.", "sort_order": 10},
        {"name": "Other", "description": "Unclassified clinical state.", "sort_order": 11},
    ]
    added_states = 0
    for ps in states_data:
        if not db.query(PatientState).filter(PatientState.name == ps["name"]).first():
            db.add(PatientState(**ps))
            added_states += 1
    counts["patient_states"] = added_states

    # -------------------------------------------------------------
    # 3. Neurological Examination Options
    # -------------------------------------------------------------
    neuro_exam_data = []

    # Motor Functions
    for idx, opt in enumerate([
        "Normal", "Weakness", "Hemiparesis", "Hemiplegia", "Paraparesis", "Quadriparesis",
        "Monoparesis", "Monoplegia", "Proximal weakness", "Distal weakness",
        "Right-sided weakness", "Left-sided weakness", "Bilateral weakness", "Other"
    ], 1):
        neuro_exam_data.append({"category": "Motor Functions", "item_name": "General Motor", "name": opt, "sort_order": idx})

    # Muscle Tone
    for idx, opt in enumerate([
        "Normal", "Hypotonia", "Hypertonia", "Spastic", "Rigid", "Flaccid",
        "Increased tone", "Decreased tone", "Gegenhalten / Paratonia", "Other"
    ], 1):
        neuro_exam_data.append({"category": "Muscle Tone", "item_name": "General Tone", "name": opt, "sort_order": idx})

    # Muscle Strength Grading (MRC Scale)
    strength_limbs = ["Right Upper Limb", "Left Upper Limb", "Right Lower Limb", "Left Lower Limb"]
    strength_grades = ["5/5 - Normal power", "4/5 - Movement against resistance", "3/5 - Movement against gravity", "2/5 - Movement with gravity eliminated", "1/5 - Trace muscle contraction", "0/5 - Complete paralysis"]
    for limb in strength_limbs:
        for idx, gr in enumerate(strength_grades, 1):
            neuro_exam_data.append({"category": "Muscle Strength", "item_name": limb, "name": gr, "sort_order": idx})

    # Straight Leg Raise (SLR)
    for slr_item in ["SLR - Left", "SLR - Right"]:
        for idx, val in enumerate(["Negative", "Positive", "Limited", "Painful", "Not tested"], 1):
            neuro_exam_data.append({"category": "SLR", "item_name": slr_item, "name": val, "sort_order": idx})

    # Deep Tendon Reflexes
    reflex_items = ["Biceps Reflex", "Triceps Reflex", "Brachioradialis Reflex", "Knee Jerk", "Ankle Jerk"]
    for r_item in reflex_items:
        for idx, val in enumerate(["Normal (+2)", "Reduced (+1)", "Absent (0)", "Brisk (+3)", "Hyperreflexia / Clonus (+4)", "Asymmetric", "Not tested"], 1):
            neuro_exam_data.append({"category": "Reflexes", "item_name": r_item, "name": val, "sort_order": idx})

    # Plantar Response (Babinski)
    for p_item in ["Plantar - Right", "Plantar - Left"]:
        for idx, val in enumerate(["Flexor (Normal / Downward)", "Extensor (Babinski Positive / Upward)", "Equivocal", "Absent", "Not tested"], 1):
            neuro_exam_data.append({"category": "Plantar Response", "item_name": p_item, "name": val, "sort_order": idx})

    # Pupillary Reaction
    for idx, opt in enumerate(["Normal (Brisk & Symmetrical)", "Reactive", "Sluggish", "Non-reactive (Fixed)", "Unequal (Anisocoria)", "Dilated", "Constricted (Pinpoint)", "Other"], 1):
        neuro_exam_data.append({"category": "Pupils", "item_name": "Pupillary Reaction", "name": opt, "sort_order": idx})

    # Speech Assessment
    for idx, opt in enumerate(["Normal", "Dysarthria", "Aphasia", "Dysphasia", "Slurred speech", "Word-finding difficulty", "Reduced verbal output", "Other"], 1):
        neuro_exam_data.append({"category": "Speech Assessment", "item_name": "Speech", "name": opt, "sort_order": idx})

    # Gait & Balance
    for idx, opt in enumerate(["Normal", "Unsteady", "Ataxic", "Spastic", "Antalgic", "Shuffling / Parkinsonian", "Wide-based", "Unable to walk", "Assisted walking", "Other"], 1):
        neuro_exam_data.append({"category": "Gait & Balance", "item_name": "Gait", "name": opt, "sort_order": idx})

    # Coordination
    for idx, opt in enumerate(["Normal", "Impaired", "Dysmetria (Past-pointing)", "Ataxia", "Intention tremor", "Dysdiadochokinesia", "Not tested", "Other"], 1):
        neuro_exam_data.append({"category": "Coordination", "item_name": "Coordination", "name": opt, "sort_order": idx})

    # Sensory Modalities
    sensory_modalities = ["Pain Sensation", "Vibration Sense", "Temperature Sense", "Proprioception / Joint Position", "Light Touch / Sharp-Dull"]
    for sm in sensory_modalities:
        for idx, val in enumerate(["Normal", "Reduced (Hypesthesia)", "Increased (Hyperesthesia)", "Absent (Anesthesia)", "Asymmetric", "Not tested"], 1):
            neuro_exam_data.append({"category": "Sensory Examination", "item_name": sm, "name": val, "sort_order": idx})

    # Cranial Nerves I through XII
    cranial_nerves = [
        "CN I - Olfactory", "CN II - Optic", "CN III - Oculomotor", "CN IV - Trochlear",
        "CN V - Trigeminal", "CN VI - Abducens", "CN VII - Facial", "CN VIII - Vestibulocochlear",
        "CN IX - Glossopharyngeal", "CN X - Vagus", "CN XI - Accessory", "CN XII - Hypoglossal"
    ]
    for cn in cranial_nerves:
        for idx, val in enumerate(["Normal", "Impaired", "Weak", "Absent", "Asymmetric", "Not tested", "Other"], 1):
            neuro_exam_data.append({"category": "Cranial Nerves", "item_name": cn, "name": val, "sort_order": idx})

    # Mental Status
    for idx, opt in enumerate(["Alert", "Oriented", "Disoriented", "Confused", "Drowsy", "Obtunded", "Agitated", "Responsive", "Reduced responsiveness", "Other"], 1):
        neuro_exam_data.append({"category": "Mental Status", "item_name": "Consciousness & Orientation", "name": opt, "sort_order": idx})

    # Cerebellar Function
    for idx, opt in enumerate(["Normal", "Impaired", "Ataxia", "Dysmetria", "Tremor", "Dysdiadochokinesia", "Other"], 1):
        neuro_exam_data.append({"category": "Cerebellar Function", "item_name": "Cerebellar Signs", "name": opt, "sort_order": idx})

    # Muscle Wasting
    for idx, opt in enumerate(["None", "Mild", "Moderate", "Severe", "Focal", "Generalized", "Asymmetric", "Other"], 1):
        neuro_exam_data.append({"category": "Muscle Wasting", "item_name": "Bulk", "name": opt, "sort_order": idx})

    # Abnormal Movements
    for idx, opt in enumerate(["None", "Tremor", "Chorea", "Dystonia", "Myoclonus", "Tics", "Fasciculations", "Dyskinesia", "Other"], 1):
        neuro_exam_data.append({"category": "Abnormal Movements", "item_name": "Involuntary Movements", "name": opt, "sort_order": idx})

    # Romberg Test
    for idx, opt in enumerate(["Negative", "Positive", "Unable to perform", "Not tested"], 1):
        neuro_exam_data.append({"category": "Romberg Test", "item_name": "Romberg", "name": opt, "sort_order": idx})

    # Nystagmus
    for idx, opt in enumerate(["Absent", "Present", "Horizontal", "Vertical", "Rotatory", "Direction-changing", "Not tested", "Other"], 1):
        neuro_exam_data.append({"category": "Nystagmus", "item_name": "Nystagmus", "name": opt, "sort_order": idx})

    # Fundoscopy
    for idx, opt in enumerate(["Normal", "Abnormal", "Papilledema", "Optic disc pallor", "Hemorrhage", "Not performed", "Other"], 1):
        neuro_exam_data.append({"category": "Fundoscopy", "item_name": "Fundus", "name": opt, "sort_order": idx})

    # Meningeal Signs
    for ms in ["Brudzinski Sign", "Kernig Sign", "Neck Rigidity"]:
        for idx, val in enumerate(["Negative", "Positive", "Equivocal", "Not tested"], 1):
            neuro_exam_data.append({"category": "Meningeal Signs", "item_name": ms, "name": val, "sort_order": idx})

    # Swallowing & Facial Sensation
    for idx, opt in enumerate(["Normal", "Impaired", "Dysphagia", "Aspiration concern", "Unable to assess", "Not tested"], 1):
        neuro_exam_data.append({"category": "Swallowing Function", "item_name": "Swallowing", "name": opt, "sort_order": idx})

    # Generic Done/Not Done status
    for idx, opt in enumerate(["Done", "Not Done"], 1):
        neuro_exam_data.append({"category": "Examination Status", "item_name": "Protocol", "name": opt, "sort_order": idx})

    added_neuro = 0
    for ne in neuro_exam_data:
        existing = db.query(NeurologicalExamOption).filter(
            NeurologicalExamOption.category == ne["category"],
            NeurologicalExamOption.item_name == ne["item_name"],
            NeurologicalExamOption.name == ne["name"]
        ).first()
        if not existing:
            db.add(NeurologicalExamOption(**ne))
            added_neuro += 1
    counts["neurological_exam_options"] = added_neuro

    # -------------------------------------------------------------
    # 4. Diagnostic Tests Seed Data
    # -------------------------------------------------------------
    diag_tests_data = [
        # Laboratory
        {"name": "CBC (Complete Blood Count)", "category": "Laboratory", "sort_order": 1},
        {"name": "ESR", "category": "Laboratory", "sort_order": 2},
        {"name": "CRP (C-Reactive Protein)", "category": "Laboratory", "sort_order": 3},
        {"name": "Blood Glucose (Fasting & Random)", "category": "Laboratory", "sort_order": 4},
        {"name": "HbA1c", "category": "Laboratory", "sort_order": 5},
        {"name": "Lipid Profile", "category": "Laboratory", "sort_order": 6},
        {"name": "Liver Function Tests (LFTs)", "category": "Laboratory", "sort_order": 7},
        {"name": "Renal Function Tests (RFTs / Creatinine / Urea)", "category": "Laboratory", "sort_order": 8},
        {"name": "Serum Electrolytes (Na+, K+, Cl-)", "category": "Laboratory", "sort_order": 9},
        {"name": "Thyroid Profile (TSH, FT3, FT4)", "category": "Laboratory", "sort_order": 10},
        {"name": "Serum Vitamin B12", "category": "Laboratory", "sort_order": 11},
        {"name": "Serum Vitamin D (25-OH)", "category": "Laboratory", "sort_order": 12},
        {"name": "Serum Calcium & Magnesium", "category": "Laboratory", "sort_order": 13},
        {"name": "Serum Uric Acid", "category": "Laboratory", "sort_order": 14},
        {"name": "CSF (Cerebrospinal Fluid) Analysis", "category": "Laboratory", "sort_order": 15},
        {"name": "Autoimmune / Vasculitis Profile (ANA, dsDNA)", "category": "Laboratory", "sort_order": 16},
        # Neuro-Imaging
        {"name": "CT Brain (Plain)", "category": "Imaging", "sort_order": 17},
        {"name": "CT Brain (Contrast)", "category": "Imaging", "sort_order": 18},
        {"name": "MRI Brain (Plain & Contrast)", "category": "Imaging", "sort_order": 19},
        {"name": "MRI Brain with Stroke Protocol (DWI / FLAIR)", "category": "Imaging", "sort_order": 20},
        {"name": "MRI Spine (Cervical)", "category": "Imaging", "sort_order": 21},
        {"name": "MRI Spine (Lumbar / Lumbosacral)", "category": "Imaging", "sort_order": 22},
        {"name": "MRI Spine (Dorsal / Thoracic)", "category": "Imaging", "sort_order": 23},
        {"name": "MRA (MR Angiography Brain & Neck)", "category": "Imaging", "sort_order": 24},
        {"name": "MRV (MR Venography)", "category": "Imaging", "sort_order": 25},
        {"name": "CT Angiography (Brain / Carotid)", "category": "Imaging", "sort_order": 26},
        {"name": "X-Ray Cervical Spine (AP/Lateral)", "category": "Imaging", "sort_order": 27},
        {"name": "X-Ray Lumbosacral Spine", "category": "Imaging", "sort_order": 28},
        # Electrophysiology & Functional
        {"name": "EEG (Electroencephalogram - Routine)", "category": "Electrophysiology", "sort_order": 29},
        {"name": "Sleep-Deprived EEG", "category": "Electrophysiology", "sort_order": 30},
        {"name": "EMG / NCV (Electromyography & Nerve Conduction Studies)", "category": "Electrophysiology", "sort_order": 31},
        {"name": "Visual Evoked Potentials (VEP)", "category": "Electrophysiology", "sort_order": 32},
        # Cardiovascular & Vascular
        {"name": "Carotid & Vertebral Doppler Ultrasound", "category": "Cardiovascular", "sort_order": 33},
        {"name": "Echocardiography (2D Echo)", "category": "Cardiovascular", "sort_order": 34},
        {"name": "ECG (12-Lead Electrocardiogram)", "category": "Cardiovascular", "sort_order": 35},
        {"name": "24-Hour Holter Monitoring", "category": "Cardiovascular", "sort_order": 36},
    ]
    added_tests = 0
    for dt in diag_tests_data:
        if not db.query(DiagnosticTest).filter(DiagnosticTest.name == dt["name"]).first():
            db.add(DiagnosticTest(**dt))
            added_tests += 1
    counts["diagnostic_tests"] = added_tests

    # -------------------------------------------------------------
    # 5. Medicines Seed Data (Generic Clinical Master Options)
    # -------------------------------------------------------------
    medicines_data = [
        {"name": "Paracetamol 500mg", "generic_name": "Paracetamol", "strength": "500mg", "form": "Tablet", "sort_order": 1},
        {"name": "Levetiracetam 500mg", "generic_name": "Levetiracetam", "strength": "500mg", "form": "Tablet", "sort_order": 2},
        {"name": "Levetiracetam 250mg", "generic_name": "Levetiracetam", "strength": "250mg", "form": "Tablet", "sort_order": 3},
        {"name": "Sodium Valproate 500mg", "generic_name": "Sodium Valproate", "strength": "500mg", "form": "Tablet", "sort_order": 4},
        {"name": "Carbamazepine 200mg", "generic_name": "Carbamazepine", "strength": "200mg", "form": "Tablet", "sort_order": 5},
        {"name": "Pregabalin 75mg", "generic_name": "Pregabalin", "strength": "75mg", "form": "Capsule", "sort_order": 6},
        {"name": "Gabapentin 300mg", "generic_name": "Gabapentin", "strength": "300mg", "form": "Capsule", "sort_order": 7},
        {"name": "Amitriptyline 25mg", "generic_name": "Amitriptyline", "strength": "25mg", "form": "Tablet", "sort_order": 8},
        {"name": "Topiramate 25mg", "generic_name": "Topiramate", "strength": "25mg", "form": "Tablet", "sort_order": 9},
        {"name": "Topiramate 50mg", "generic_name": "Topiramate", "strength": "50mg", "form": "Tablet", "sort_order": 10},
        {"name": "Propranolol 40mg", "generic_name": "Propranolol", "strength": "40mg", "form": "Tablet", "sort_order": 11},
        {"name": "Flunarizine 5mg", "generic_name": "Flunarizine", "strength": "5mg", "form": "Tablet", "sort_order": 12},
        {"name": "Flunarizine 10mg", "generic_name": "Flunarizine", "strength": "10mg", "form": "Tablet", "sort_order": 13},
        {"name": "Betahistine 16mg", "generic_name": "Betahistine", "strength": "16mg", "form": "Tablet", "sort_order": 14},
        {"name": "Aspirin 75mg", "generic_name": "Acetylsalicylic acid", "strength": "75mg", "form": "Tablet", "sort_order": 15},
        {"name": "Clopidogrel 75mg", "generic_name": "Clopidogrel", "strength": "75mg", "form": "Tablet", "sort_order": 16},
        {"name": "Atorvastatin 20mg", "generic_name": "Atorvastatin", "strength": "20mg", "form": "Tablet", "sort_order": 17},
        {"name": "Atorvastatin 40mg", "generic_name": "Atorvastatin", "strength": "40mg", "form": "Tablet", "sort_order": 18},
        {"name": "Citicoline 500mg", "generic_name": "Citicoline", "strength": "500mg", "form": "Tablet", "sort_order": 19},
        {"name": "Piracetam 800mg", "generic_name": "Piracetam", "strength": "800mg", "form": "Tablet", "sort_order": 20},
        {"name": "Baclofen 10mg", "generic_name": "Baclofen", "strength": "10mg", "form": "Tablet", "sort_order": 21},
        {"name": "Tizanidine 2mg", "generic_name": "Tizanidine", "strength": "2mg", "form": "Tablet", "sort_order": 22},
        {"name": "Donepezil 5mg", "generic_name": "Donepezil", "strength": "5mg", "form": "Tablet", "sort_order": 23},
        {"name": "Memantine 10mg", "generic_name": "Memantine", "strength": "10mg", "form": "Tablet", "sort_order": 24},
        {"name": "Levodopa + Carbidopa 250/25mg", "generic_name": "Levodopa / Carbidopa", "strength": "250/25mg", "form": "Tablet", "sort_order": 25},
        {"name": "Pramipexole 0.25mg", "generic_name": "Pramipexole", "strength": "0.25mg", "form": "Tablet", "sort_order": 26},
        {"name": "Mecobalamin 500mcg", "generic_name": "Methylcobalamin (B12)", "strength": "500mcg", "form": "Tablet", "sort_order": 27},
        {"name": "Vitamin D3 200,000 IU", "generic_name": "Cholecalciferol", "strength": "200000 IU", "form": "Injection", "sort_order": 28},
        {"name": "Omeprazole 20mg", "generic_name": "Omeprazole", "strength": "20mg", "form": "Capsule", "sort_order": 29},
        {"name": "Naproxen 500mg", "generic_name": "Naproxen", "strength": "500mg", "form": "Tablet", "sort_order": 30},
    ]
    added_meds = 0
    for med in medicines_data:
        if not db.query(Medicine).filter(Medicine.name == med["name"]).first():
            db.add(Medicine(**med))
            added_meds += 1
    counts["medicines"] = added_meds

    # -------------------------------------------------------------
    # 6. Medicine Frequencies Seed Data (Urdu / Roman Urdu / English)
    # -------------------------------------------------------------
    frequencies_data = [
        {"name": "Morning", "urdu_label": "صبح", "roman_urdu": "Subah", "sort_order": 1},
        {"name": "Afternoon", "urdu_label": "دوپہر", "roman_urdu": "Dopahar", "sort_order": 2},
        {"name": "Evening", "urdu_label": "شام", "roman_urdu": "Shaam", "sort_order": 3},
        {"name": "Night / Bedtime", "urdu_label": "رات", "roman_urdu": "Raat", "sort_order": 4},
        {"name": "Morning & Evening (BD)", "urdu_label": "صبح و شام", "roman_urdu": "Subah aur Shaam", "sort_order": 5},
        {"name": "Morning & Afternoon", "urdu_label": "صبح و دوپہر", "roman_urdu": "Subah aur Dopahar", "sort_order": 6},
        {"name": "Afternoon & Evening", "urdu_label": "دوپہر و شام", "roman_urdu": "Dopahar aur Shaam", "sort_order": 7},
        {"name": "Morning & Night", "urdu_label": "صبح و رات", "roman_urdu": "Subah aur Raat", "sort_order": 8},
        {"name": "Afternoon & Night", "urdu_label": "دوپہر و رات", "roman_urdu": "Dopahar aur Raat", "sort_order": 9},
        {"name": "Evening & Night", "urdu_label": "شام و رات", "roman_urdu": "Shaam aur Raat", "sort_order": 10},
        {"name": "Three times a day (TDS)", "urdu_label": "صبح، دوپہر، شام", "roman_urdu": "Subah, Dopahar, Shaam", "sort_order": 11},
        {"name": "Four times a day (QDS)", "urdu_label": "صبح، دوپہر، شام، رات", "roman_urdu": "Subah, Dopahar, Shaam, Raat", "sort_order": 12},
        {"name": "As needed (PRN)", "urdu_label": "حسب ضرورت", "roman_urdu": "Hasb-e-Zaroorat", "sort_order": 13},
        {"name": "Alternate days", "urdu_label": "ایک دن چھوڑ کر", "roman_urdu": "Aik din chorr kar", "sort_order": 14},
        {"name": "Once weekly", "urdu_label": "ہفتے میں ایک بار", "roman_urdu": "Haftey mein aik baar", "sort_order": 15},
    ]
    added_freq = 0
    for fr in frequencies_data:
        if not db.query(MedicineFrequency).filter(MedicineFrequency.name == fr["name"]).first():
            db.add(MedicineFrequency(**fr))
            added_freq += 1
    counts["medicine_frequencies"] = added_freq

    # -------------------------------------------------------------
    # 7. Medicine Dosages Seed Data
    # -------------------------------------------------------------
    dosages_data = [
        {"name": "¼", "urdu_label": "1 چوتھائی", "sort_order": 1},
        {"name": "½", "urdu_label": "آدھی", "sort_order": 2},
        {"name": "1", "urdu_label": "ایک", "sort_order": 3},
        {"name": "1½", "urdu_label": "ڈیڑھ", "sort_order": 4},
        {"name": "2", "urdu_label": "دو", "sort_order": 5},
        {"name": "2½", "urdu_label": "ڈھائی", "sort_order": 6},
        {"name": "3", "urdu_label": "تین", "sort_order": 7},
        {"name": "5ml (1 teaspoon)", "urdu_label": "1 چائے کا چمچ (5 ملی لیٹر)", "sort_order": 8},
        {"name": "10ml (2 teaspoons)", "urdu_label": "2 چائے کے چمچ (10 ملی لیٹر)", "sort_order": 9},
        {"name": "1 puff", "urdu_label": "1 پف", "sort_order": 10},
        {"name": "2 drops", "urdu_label": "2 قطرے", "sort_order": 11},
    ]
    added_dosages = 0
    for d in dosages_data:
        if not db.query(MedicineDosage).filter(MedicineDosage.name == d["name"]).first():
            db.add(MedicineDosage(**d))
            added_dosages += 1
    counts["medicine_dosages"] = added_dosages

    # -------------------------------------------------------------
    # 8. Medicine Instructions Seed Data
    # -------------------------------------------------------------
    instructions_data = [
        {"name": "After meals", "urdu_label": "کھانے کے بعد", "sort_order": 1},
        {"name": "Before meals", "urdu_label": "کھانے سے پہلے", "sort_order": 2},
        {"name": "Empty stomach", "urdu_label": "خالی پیٹ", "sort_order": 3},
        {"name": "With food / meals", "urdu_label": "کھانے کے ساتھ", "sort_order": 4},
        {"name": "Morning empty stomach", "urdu_label": "صبح نہار منہ (خالی پیٹ)", "sort_order": 5},
        {"name": "At bedtime", "urdu_label": "سونے سے پہلے", "sort_order": 6},
        {"name": "As needed for pain", "urdu_label": "درد کی صورت میں حسب ضرورت", "sort_order": 7},
        {"name": "As needed for headache", "urdu_label": "سر درد کی صورت میں حسب ضرورت", "sort_order": 8},
        {"name": "Do not stop suddenly", "urdu_label": "دوا اچانک بند نہ کریں", "sort_order": 9},
        {"name": "As advised by doctor", "urdu_label": "ڈاکٹر کی ہدایت کے مطابق", "sort_order": 10},
    ]
    added_instr = 0
    for ins in instructions_data:
        if not db.query(MedicineInstruction).filter(MedicineInstruction.name == ins["name"]).first():
            db.add(MedicineInstruction(**ins))
            added_instr += 1
    counts["medicine_instructions"] = added_instr

    # -------------------------------------------------------------
    # 9. Follow-Up Options Seed Data
    # -------------------------------------------------------------
    follow_up_data = [
        {"name": "1 week later", "urdu_label": "1 ہفتے بعد", "sort_order": 1},
        {"name": "2 weeks later", "urdu_label": "2 ہفتے بعد", "sort_order": 2},
        {"name": "3 weeks later", "urdu_label": "3 ہفتے بعد", "sort_order": 3},
        {"name": "1 month later", "urdu_label": "1 ماہ بعد", "sort_order": 4},
        {"name": "2 months later", "urdu_label": "2 ماہ بعد", "sort_order": 5},
        {"name": "3 months later", "urdu_label": "3 ماہ بعد", "sort_order": 6},
        {"name": "6 months later", "urdu_label": "6 ماہ بعد", "sort_order": 7},
        {"name": "As needed", "urdu_label": "ضرورت کے مطابق", "sort_order": 8},
        {"name": "With test reports", "urdu_label": "ٹیسٹ رپورٹس کے ساتھ", "sort_order": 9},
        {"name": "Follow-up as advised", "urdu_label": "ڈاکٹر کے مشورے کے مطابق", "sort_order": 10},
    ]
    added_fu = 0
    for fu in follow_up_data:
        if not db.query(FollowUpOption).filter(FollowUpOption.name == fu["name"]).first():
            db.add(FollowUpOption(**fu))
            added_fu += 1
    counts["follow_up_options"] = added_fu

    db.commit()
    logger.info(f"Clinical master data seeded: {counts}")
    return counts
