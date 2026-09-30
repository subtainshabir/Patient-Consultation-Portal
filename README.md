# Patient Consultation Portal

A clinical management and neurological consultation platform engineered for medical specialists and clinical staff. The portal streamlines end-to-end outpatient workflows—from patient intake, demographic tracking, and vital signs monitoring to structured neurological examinations, mental status assessments, bilingual prescription generation, and follow-up scheduling.

---

## Table of Contents

- [Introduction](#introduction)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Architecture Diagram](#architecture-diagram)
- [Class Diagram](#class-diagram)
- [Sequence Diagram](#sequence-diagram)
- [Technologies Used](#technologies-used)
- [Directory Structure](#directory-structure)
- [Getting Started & Local Setup](#getting-started--local-setup)
  - [Prerequisites](#prerequisites)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Frontend Setup](#3-frontend-setup)
  - [4. First-Time Administrator Onboarding](#4-first-time-administrator-onboarding)
- [Environment Configuration](#environment-configuration)
- [API Reference](#api-reference)
- [Automated Testing & Quality Assurance](#automated-testing--quality-assurance)
- [Security & Compliance](#security--compliance)
- [License](#license)

---

## Introduction

The **Patient Consultation Portal** is designed to address the high-precision requirements of outpatient clinical practices, with specialized workflows for neurology. Built as a decoupled Single Page Application (SPA) paired with a high-performance RESTful API, the system eliminates paper-based record-keeping while standardizing clinical evaluations.

### Core Objectives
- **Standardized Neurological Records**: Capture structured assessments including Cranial Nerves, Motor Functions, Deep Tendon Reflexes, Sensory Exam, Coordination, Gait & Balance, as well as validated clinical scales (MMSE, GCS, NIHSS).
- **Bilingual Prescription Builder**: Formulate medical prescriptions with dual English and Urdu administration instructions (dosage, frequency, and custom meal/timing notes) tailored for patient comprehension.
- **Fast Clinical Intake**: Rapid patient lookup by unique Medical Record ID, mobile number, or CNIC with real-time duplicate detection.
- **Role-Based Workflows**: Tailored user interfaces for Clinic Administrators, Doctors, and Reception Staff.
- **Master Data Flexibility**: Maintain centralized formularies, symptom catalogs, examination options, and test directories without code modifications.

---

## Key Features

- **Role-Based Access Control (RBAC)**: Secure access tailored to `ADMIN`, `DOCTOR`, and `STAFF` roles with strict route and API-level authorization guards.
- **Patient Directory & Audit Trail**: Unique permanent patient identifiers, demographic tracking, duplicate prevention, and patient consultation histories.
- **Multi-Section Consultation Workflow**:
  - General & neurological vitals (Blood Pressure, Pulse, SpO2, Temperature, Respiratory Rate, BMI, Fall Risk).
  - Categorized symptom tracking with clinical notes.
  - Granular neurological physical exam findings by category.
  - Diagnostic test ordering and result tracking.
  - Mental status assessment (MMSE, Glasgow Coma Scale, NIHSS).
  - Treatment plan notes and non-medicinal clinical instructions.
- **Prescription & Follow-Up Management**:
  - Drug formulary integration with dosage, duration, and bilingual (English / Urdu) frequency instructions.
  - Follow-up period calculators and reminder tracking.
  - Print-ready and downloadable clinical consultation summaries.
- **Clinic Branding & Administration**:
  - Configurable clinic letterheads, doctor credentials, address, and logo.
  - Master data CRUD for symptoms, medications, dosages, diagnostic investigations, and exam parameters.

---

## System Architecture

The portal follows a modular, multi-tier client-server architecture designed for reliability, responsiveness, and clear separation of concerns:

1. **Client / Presentation Tier (Frontend)**:
   - Built with **React 19**, **TypeScript**, and **Vite**.
   - Styled with modern **Tailwind CSS** implementing clinical design standards, responsive navigation (desktop sidebar and mobile slide-out drawer), accessible forms, and rich micro-interactions.
   - Client-side routing managed by **React Router v7** with declarative role-based route protection.
   - Server state, asynchronous caching, and optimistic updates handled via **TanStack React Query v5**.
   - Robust form validation powered by **React Hook Form** and **Zod**.

2. **API & Business Logic Tier (Backend)**:
   - Built with **FastAPI** (Python 3.10+) running asynchronously on the **Uvicorn** ASGI server.
   - Structured domain layering: Modular API routers, dependency-injected security contexts, Pydantic v2 schemas for request/response serialization, and transactional service handlers.
   - Stateless authentication using industry-standard **JWT (JSON Web Tokens)** with cryptographically signed bearer tokens and secure password hashing via **Bcrypt / PBKDF2**.

3. **Persistence & Data Access Tier**:
   - Object-Relational Mapping (ORM) powered by **SQLAlchemy 2.0** utilizing declarative models and explicit relationship cascades.
   - Database schema migrations managed via **Alembic**.
   - Primary database target: **PostgreSQL**.
   - Embedded development fallback: Automatic zero-configuration **SQLite** fallback for fast local testing and offline development.

---

## Architecture Diagram

```mermaid
flowchart TB
    subgraph ClientTier["Client / Presentation Tier"]
        Browser["Modern Web Browser (Desktop / Tablet / Mobile)"]
        subgraph ReactApp["React 19 + Vite SPA"]
            Router["React Router v7 (Protected & Role Guards)"]
            State["TanStack React Query v5 (Cache & Server State)"]
            Forms["React Hook Form + Zod Schema Validation"]
            UI["Tailwind CSS UI Components & Layouts"]
        end
        Browser --> ReactApp
    end

    subgraph APITier["Application & API Gateway Tier (FastAPI)"]
        ASGI["Uvicorn ASGI Server"]
        Middleware["CORS & Error Handling Middleware"]
        Security["JWT Authentication & RBAC Dependencies"]
        
        subgraph Routers["API Route Controllers"]
            AuthRoute["/api/auth (Login, Setup, Me)"]
            PatientRoute["/api/patients (CRUD, Duplicate Check)"]
            ConsultRoute["/api/consultations (Clinical Workflow)"]
            MasterRoute["/api/master-data (Formulary, Symptoms, Tests)"]
            AdminRoute["/api/admin (Users, Settings, Stats)"]
            DashRoute["/api/dashboard (Doctor / Staff Summaries)"]
        end
        
        ASGI --> Middleware --> Security --> Routers
    end

    subgraph ServiceTier["Service & Data Access Tier"]
        AuthSvc["Authentication & Token Service"]
        ClinicalSvc["Consultation & Prescription Service"]
        ReportSvc["Report & Document Generator"]
        ORM["SQLAlchemy 2.0 ORM Engine"]
    end

    subgraph DatabaseTier["Persistence Tier"]
        Alembic["Alembic Database Migrations"]
        Postgres[("PostgreSQL (Production Target)")]
        SQLite[("SQLite (Local Dev Fallback)")]
    end

    ReactApp -- "HTTPS / JSON REST API" --> ASGI
    Routers --> AuthSvc & ClinicalSvc & ReportSvc
    AuthSvc & ClinicalSvc & ReportSvc --> ORM
    Alembic -.-> Postgres & SQLite
    ORM --> Postgres
    ORM -. "Dev Fallback" .-> SQLite
```

---

## Class Diagram

The following diagram illustrates the domain models, primary entities, and relational mappings governing the clinical portal:

```mermaid
classDiagram
    direction TB

    class UserRole {
        <<enumeration>>
        ADMIN
        DOCTOR
        STAFF
    }

    class Gender {
        <<enumeration>>
        Male
        Female
        Other
        Prefer not to specify
    }

    class User {
        +int id
        +string email
        +string username
        +string hashed_password
        +string full_name
        +UserRole role
        +bool is_active
        +datetime created_at
        +datetime updated_at
    }

    class Patient {
        +int id
        +string patient_id
        +string full_name
        +int age
        +Gender gender
        +string mobile_number
        +string cnic
        +bool is_active
        +datetime created_at
        +int created_by_id
    }

    class Consultation {
        +int id
        +string consultation_id
        +int patient_id
        +int doctor_id
        +datetime consultation_date
        +int patient_state_id
        +string symptom_notes
        +string power_text
        +int mmse_score
        +int gcs_score
        +string clinical_description
        +string additional_examination
        +string treatment_plan
        +int follow_up_option_id
        +date follow_up_date
        +string follow_up_instructions
        +string follow_up_status
        +datetime created_at
    }

    class ConsultationVitals {
        +int id
        +int consultation_id
        +int systolic_bp
        +int diastolic_bp
        +int pulse_rate
        +float temperature
        +int oxygen_saturation
        +int nihss_score
        +string fall_risk_status
        +string fall_risk_notes
        +float bmi
        +float blood_glucose
    }

    class ConsultationSymptom {
        +int id
        +int consultation_id
        +int symptom_id
        +string symptom_name
        +string category
        +string notes
        +int sort_order
    }

    class ConsultationExamination {
        +int id
        +int consultation_id
        +string category
        +string item_name
        +string finding
        +int finding_id
        +string status
        +string observation
    }

    class ConsultationDiagnosticTest {
        +int id
        +int consultation_id
        +int diagnostic_test_id
        +string test_name
        +string category
        +string status
        +string clinical_indication
        +string result
    }

    class PrescriptionItem {
        +int id
        +int consultation_id
        +int medicine_id
        +string medicine_name
        +int frequency_id
        +string frequency_name
        +string dosage
        +int duration_days
        +int instruction_id
        +string instruction_name
        +string custom_instruction
        +int sort_order
    }

    class ConsultationReport {
        +int id
        +string report_id
        +int consultation_id
        +int patient_id
        +string file_name
        +string storage_path
        +int version
        +bool is_latest
        +int generated_by_id
    }

    class Symptom {
        +int id
        +string name
        +string category
        +bool is_active
        +int sort_order
    }

    class Medicine {
        +int id
        +string name
        +string generic_name
        +string strength
        +string form
        +bool is_active
    }

    class MedicineFrequency {
        +int id
        +string name
        +string urdu_label
        +string roman_urdu
        +bool is_active
    }

    class FollowUpOption {
        +int id
        +string name
        +string urdu_label
        +bool is_active
    }

    class ClinicSetting {
        +int id
        +string doctor_name
        +string doctor_title
        +string specialization
        +string qualifications
        +string clinic_name
        +string clinic_phone
        +string clinic_email
        +string clinic_address
        +string logo_path
    }

    User "1" -- "0..*" Patient : registers >
    User "1" -- "0..*" Consultation : conducts >
    Patient "1" *-- "0..*" Consultation : has >
    Consultation "1" *-- "1" ConsultationVitals : records >
    Consultation "1" *-- "0..*" ConsultationSymptom : includes >
    Consultation "1" *-- "0..*" ConsultationExamination : performs >
    Consultation "1" *-- "0..*" ConsultationDiagnosticTest : orders >
    Consultation "1" *-- "0..*" PrescriptionItem : prescribes >
    Consultation "1" *-- "0..*" ConsultationReport : generates >
    
    Symptom "1" -- "0..*" ConsultationSymptom : references
    Medicine "1" -- "0..*" PrescriptionItem : references
    MedicineFrequency "1" -- "0..*" PrescriptionItem : references
    FollowUpOption "1" -- "0..*" Consultation : specifies
```

---

## Sequence Diagram

The following sequence diagram outlines the complete clinical workflow: authenticating the practitioner, initiating a consultation, saving clinical data, and generating a printable consultation prescription report.

```mermaid
sequenceDiagram
    autonumber
    actor Clinician as Doctor / Clinician
    participant UI as Frontend Client (React)
    participant Auth as Auth / Security Layer
    participant API as Consultation API
    participant DB as Database (PostgreSQL / SQLite)
    participant DocGen as Report Service

    %% Authentication
    Clinician->>UI: Enter credentials (username & password)
    UI->>Auth: POST /api/auth/login
    Auth->>DB: Query user & verify password hash
    DB-->>Auth: User record valid
    Auth-->>UI: Return JWT Bearer Access Token & User Profile
    UI-->>Clinician: Render Doctor Dashboard

    %% Starting Consultation
    Clinician->>UI: Select patient or create consultation
    UI->>API: GET /api/master-data (Symptoms, Exam Options, Medicines)
    API->>DB: Fetch active master data records
    DB-->>API: Master data collections
    API-->>UI: Return master datasets for autocompletion

    %% Recording Clinical Data
    Clinician->>UI: Record Vitals, Symptoms, Neuro Exam & Prescriptions
    Clinician->>UI: Click "Save Consultation"
    UI->>API: POST /api/consultations (Payload with vitals, exams, rx items)
    
    activate API
    API->>Auth: Validate Bearer Token & Doctor Role
    Auth-->>API: Authorized
    API->>DB: Begin Atomic Database Transaction
    API->>DB: Insert Consultation record
    API->>DB: Insert ConsultationVitals
    API->>DB: Bulk insert Symptoms & Neurological Examinations
    API->>DB: Bulk insert PrescriptionItems & Diagnostic Orders
    API->>DB: Commit Transaction
    DB-->>API: Confirmation & Generated Consultation ID
    deactivate API
    
    API-->>UI: 201 Created (Consultation Response)
    UI-->>Clinician: Display Success Toast & Consultation Summary

    %% Generating Printable Prescription
    Clinician->>UI: Click "Generate & Print Report"
    UI->>API: POST /api/consultations/{id}/report
    activate API
    API->>DocGen: Compile clinical data & clinic settings
    DocGen->>DocGen: Render bilingual clinical layout
    DocGen->>DB: Save ConsultationReport metadata
    DocGen-->>API: Generated Document / Download Path
    deactivate API
    API-->>UI: Return Report Details
    UI->>API: GET /api/consultations/{id}/report/preview
    API-->>UI: Render printable prescription modal
    UI-->>Clinician: Open native browser print dialog
```

---

## Technologies Used

| Domain | Technology / Library | Version / Details | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | **React** | `^19.2.8` | Declarative UI component architecture |
| **Language (Client)** | **TypeScript** | `~6.0.2` | Static type safety and developer productivity |
| **Build & Tooling** | **Vite** | `^8.3.0` | Ultra-fast HMR and optimized production bundling |
| **Styling & Design** | **Tailwind CSS** | `^3.4.19` | Modern, responsive clinical utility styles |
| **Client Routing** | **React Router DOM** | `^7.18.4` | Declarative navigation, route guards, and layouts |
| **Server State Management** | **TanStack React Query** | `^5.104.0` | Server-state caching, synchronization, and queries |
| **Form Handling** | **React Hook Form** | `^7.89.0` | Performant, uncontrolled form state management |
| **Schema Validation** | **Zod** | `^3.25.76` | Runtime type validation for clinical inputs |
| **Iconography** | **Lucide React** | `^1.48.0` | Clean, modern medical and system icons |
| **Backend Framework** | **FastAPI** | `>=0.110.0` | Asynchronous, OpenAPI-compliant REST API framework |
| **Language (Server)** | **Python** | `>=3.10` | Robust backend processing language |
| **ASGI Server** | **Uvicorn** | `>=0.28.0` | High-performance asynchronous server implementation |
| **Data Validation** | **Pydantic** | `>=2.6.0` | Strict data serialization and contract enforcement |
| **Database ORM** | **SQLAlchemy** | `>=2.0.28` | Modern declarative ORM and query builder |
| **Database Migrations** | **Alembic** | `>=1.13.1` | Schema version control and migration management |
| **Primary Database** | **PostgreSQL** | Target | Enterprise-grade relational database engine |
| **Dev Fallback DB** | **SQLite 3** | Embedded | Built-in zero-config local development database |
| **Security & Auth** | **Python-Jose** & **Passlib** | Cryptography / Bcrypt | JWT token generation, verification, and password hashing |
| **Testing & Linting** | **Pytest** & **Oxlint** | Standard | Backend integration testing and fast code linting |

---

## Directory Structure

```text
Patient Consultation Portal/
├── frontend/                         # Client-Side Application (React + Vite)
│   ├── src/
│   │   ├── assets/                   # Clinical SVG graphics and brand assets
│   │   ├── components/
│   │   │   ├── common/               # BrandLogo, ErrorBoundary, StatCards
│   │   │   ├── consultation/         # VitalsSection, NeuroExamSection, TreatmentPlanSection
│   │   │   └── ui/                   # Button, Input, Select, SearchableSelect,
│   │   │                             # MultiSelect, Card, Dialog, ConfirmationDialog,
│   │   │                             # PageHeader, EmptyState, LoadingSkeleton, ResponsiveTable
│   │   ├── constants/                # Clinical options, status enums, constants
│   │   ├── context/                  # AuthContext, ToastContext
│   │   ├── hooks/                    # useAuth, useToast, useDebounce
│   │   ├── layouts/                  # DashboardLayout (Sidebar & Mobile Drawer), AuthLayout
│   │   ├── pages/
│   │   │   ├── admin/                # AdminDashboard, UserManagement, ClinicSettings, MasterData
│   │   │   ├── consultations/        # NewConsultationPage, ConsultationsListPage, ConsultationDetailPage
│   │   │   ├── doctor/               # DoctorDashboardPage
│   │   │   ├── patients/             # PatientListPage, RegisterPatientPage, PatientProfilePage
│   │   │   ├── staff/                # StaffDashboardPage
│   │   │   ├── LoginPage.tsx         # Unified authentication screen
│   │   │   └── SetupAdminPage.tsx    # Initial administrator bootstrap screen
│   │   ├── routes/                   # AppRoutes, ProtectedRoute, PublicRoute
│   │   ├── services/                 # Centralized api.ts, authService, patientService, consultationService
│   │   ├── types/                    # Domain TypeScript interfaces and types
│   │   ├── utils/                    # Utility helpers (cn, date formatting, print helpers)
│   │   ├── App.tsx                   # Main route tree wrapper
│   │   ├── main.tsx                  # Application bootstrap
│   │   └── index.css                 # Design system tokens and global styles
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/                          # Server-Side Application (FastAPI + SQLAlchemy)
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/               # Modular REST endpoints
│   │   │   │   ├── admin.py          # Admin statistics, user CRUD, clinic profile
│   │   │   │   ├── auth.py           # Login, setup-status, setup-admin, user profile
│   │   │   │   ├── consultations.py  # Consultation creation, detail, report preview
│   │   │   │   ├── dashboard.py      # Role-specific dashboard aggregation
│   │   │   │   ├── health.py         # System health verification
│   │   │   │   ├── master_data.py    # Public & clinical master data endpoints
│   │   │   │   └── patients.py       # Patient registration, search, duplicate check
│   │   │   └── deps.py               # Dependency injection: get_db, get_current_user, require_roles
│   │   ├── core/
│   │   │   ├── config.py             # Pydantic BaseSettings environment loader
│   │   │   └── security.py           # Bcrypt hashing and JWT encoding/decoding
│   │   ├── db/
│   │   │   ├── base.py               # DeclarativeBase class
│   │   │   └── session.py            # PostgreSQL engine with SQLite automatic fallback
│   │   ├── models/                   # SQLAlchemy ORM database models
│   │   │   ├── consultation.py       # Consultation, Vitals, Symptoms, Examinations, Prescriptions
│   │   │   ├── master_data.py        # Symptoms, Exam Options, Medicines, Frequencies, Dosages
│   │   │   ├── patient.py            # Patient demographics and medical record numbering
│   │   │   ├── settings.py           # Clinic profile and letterhead preferences
│   │   │   └── user.py               # System user accounts and roles
│   │   ├── schemas/                  # Pydantic request and response models
│   │   ├── services/                 # Reusable domain business services
│   │   └── main.py                   # FastAPI application initialization & middleware
│   ├── alembic/                      # Alembic database migration scripts
│   ├── tests/                        # Pytest automated test suites
│   ├── init_db.py                    # Database tables and master data seed script
│   ├── requirements.txt              # Backend Python dependencies
│   ├── alembic.ini                   # Alembic configuration
│   └── .env.example                  # Template environment configuration
│
└── README.md
```

---

## Getting Started & Local Setup

Follow these step-by-step instructions to clone, configure, and execute the complete portal on your local development machine.

### Prerequisites

Ensure the following tools are installed on your workstation:
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **Python**: v3.10.0 or higher (Python 3.11 / 3.12 recommended)
- **Git**: Distributed version control
- **PostgreSQL** *(Optional)*: Recommended for production setups. If PostgreSQL is not installed locally, the backend automatically utilizes an embedded SQLite database.

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/patient-consultation-portal.git
cd patient-consultation-portal
```

---

### 2. Backend Setup

#### Step 2.1: Create and Activate Virtual Environment

**Windows (PowerShell / Command Prompt):**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
```

**Linux / macOS:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

#### Step 2.2: Install Backend Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### Step 2.3: Configure Environment Variables

Create your `.env` file from the provided example template:

**Windows:**
```powershell
copy .env.example .env
```

**Linux / macOS:**
```bash
cp .env.example .env
```

*(Review `.env` settings—by default, `USE_SQLITE_DEV_FALLBACK=True` allows instant execution without setting up a PostgreSQL service).*

#### Step 2.4: Initialize Database & Seed Master Data

Execute the database initializer to create all tables and populate medical master data (neurological examination parameters, common neurological symptoms, drug formularies, frequencies, and dosages):

```bash
python init_db.py
```

Apply database migrations:
```bash
alembic upgrade head
```

#### Step 2.5: Start the Backend API Server

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend server will start at `http://127.0.0.1:8000`. You can inspect:
- **Interactive Swagger Documentation**: [http://127.0.0.1:8000/api/docs](http://127.0.0.1:8000/api/docs)
- **Health Check Endpoint**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

### 3. Frontend Setup

Open a new terminal window, navigate to the `frontend` directory, and follow these steps:

#### Step 3.1: Install Node Dependencies

```bash
cd frontend
npm install
```

#### Step 3.2: Launch the Development Server

```bash
npm run dev
```

The frontend application will be accessible at:
```text
http://localhost:5173
```

---

### 4. First-Time Administrator Onboarding

When starting with a freshly initialized database, no default administrative credentials exist for security reasons:

1. Open your browser and navigate to: `http://localhost:5173`
2. The portal will automatically detect that no administrative account exists and redirect to the **Initial System Setup** screen (`/setup`).
3. Complete the form to register your **Primary Administrator** (Full Name, Username, Email, and Password).
4. Upon successful setup, log in with your newly created credentials.
5. From the **Admin Dashboard**, you can:
   - Configure clinic contact details and letterhead branding in **Settings**.
   - Create accounts for **Doctors** and **Staff** members.
   - Review and customize clinical master data (Symptoms, Medicines, Exam Checklists).

---

## Environment Configuration

### Backend Environment Variables (`backend/.env`)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `ENVIRONMENT` | Application operational mode | `development` or `production` |
| `PROJECT_NAME` | Display name of the consultation portal | `Patient Consultation Portal` |
| `API_PREFIX` | Prefix for all backend REST endpoints | `/api` |
| `SECRET_KEY` | Cryptographic secret for signing JWTs (min 32 chars) | `your-secure-random-secret-key-min-32-chars` |
| `ALGORITHM` | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Lifetime of issued authentication tokens | `480` *(8 hours)* |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/consultation_db` |
| `USE_SQLITE_DEV_FALLBACK` | Enable local SQLite database fallback if PostgreSQL is unavailable | `True` |
| `SQLITE_DB_PATH` | Storage path for SQLite fallback database | `./dev_portal.db` |
| `CORS_ORIGINS` | Comma-delimited origins permitted for cross-origin requests | `http://localhost:5173,http://127.0.0.1:5173` |

---

## API Reference

The backend provides a RESTful API with automated OpenAPI specifications accessible at `/api/docs`. The key endpoint groups include:

### Authentication & Bootstrap
- `GET /api/auth/setup-status` — Check whether initial system administrator exists.
- `POST /api/auth/setup-admin` — Provision initial system administrator.
- `POST /api/auth/login` — Authenticate user and obtain JWT access token.
- `GET /api/auth/me` — Retrieve authenticated user profile and permissions.
- `POST /api/auth/logout` — Revoke and clear active session.

### Patient Management
- `GET /api/patients` — Paginated patient directory with search (by Name, ID, Mobile, CNIC).
- `POST /api/patients` — Register a new patient and assign a permanent medical record identifier.
- `POST /api/patients/check-duplicate` — Check for potential duplicate patient records in real-time.
- `GET /api/patients/{patient_id}` — Retrieve full patient demographic profile.
- `PATCH /api/patients/{patient_id}` — Update demographic information.
- `GET /api/patients/{patient_id}/consultations` — List clinical consultation history for a patient.

### Clinical Consultations
- `GET /api/consultations/current-date` — Obtain synchronized server timestamp.
- `POST /api/consultations` — Submit a comprehensive clinical consultation record.
- `GET /api/consultations` — Search and filter consultation records across patients.
- `GET /api/consultations/{consultation_id}` — Fetch detailed consultation findings, vitals, and prescriptions.
- `PUT /api/consultations/{consultation_id}` — Amend or update consultation documentation.
- `POST /api/consultations/{consultation_id}/report` — Generate a versioned clinical consultation report.
- `GET /api/consultations/{consultation_id}/report/preview` — Preview printable clinical prescription layout.
- `GET /api/consultations/{consultation_id}/report/download` — Download consultation prescription document.

### Master Data & Formulary
- `GET /api/master-data/symptoms` — Retrieve clinical symptom options.
- `GET /api/master-data/neurological-examinations` — Retrieve neurological exam checklist values.
- `GET /api/master-data/medicines` — Search medication formulary by brand or generic name.
- `GET /api/master-data/frequencies` — Retrieve bilingual prescription frequencies (Urdu / English).
- `GET /api/master-data/dosages` — Retrieve medication dosage formats.
- `GET /api/master-data/diagnostic-tests` — Retrieve diagnostic laboratory and imaging catalog.

### System Administration
- `GET /api/admin/stats` — High-level clinic operational metrics.
- `GET /api/admin/users` — List system user accounts.
- `POST /api/admin/users` — Provision new Doctor or Staff user accounts.
- `GET /api/admin/settings` — Fetch clinic letterhead and doctor profile settings.
- `PUT /api/admin/settings` — Update clinic address, contact info, and credentials.
- `POST /api/admin/settings/logo` — Upload customized clinic letterhead logo.

---

## Automated Testing & Quality Assurance

### Running Backend Tests
Execute the automated test suite using `pytest`:

```bash
cd backend
pytest
```

To run tests with detailed verbosity and execution times:
```bash
pytest -v --durations=10
```

### Running Frontend Verification
Run static typechecking and linting on the frontend codebase:

```bash
cd frontend
npm run build
```

---

## Security & Compliance

- **Stateless Authorization**: All protected endpoints require a cryptographically signed `Bearer <token>` in the `Authorization` header.
- **Role Verification**: Routes enforce principle of least privilege using dependency injection guards (`ADMIN`, `DOCTOR`, `STAFF`).
- **Password Protection**: Passwords are never stored in plaintext and are hashed using salted cryptographic hashing algorithms (**Bcrypt / PBKDF2**).
- **Sanitized Error Responses**: Internal database errors and server exceptions are trapped and sanitized to prevent leaking stack traces or schema structures to clients.
- **SQL Injection Prevention**: Database interaction is strictly managed through parameterized queries via SQLAlchemy ORM.
- **CORS Policies**: Explicit origin whitelisting protects against unauthorized cross-site requests.

---

## License

This software is distributed under the proprietary license of the clinic administration. Unauthorized copying, distribution, or modification of these files is strictly prohibited.
