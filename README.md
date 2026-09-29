# Dr. Rauf Neurology — Patient Consultation Portal

**Phase 1: Project Foundation, Authentication & Responsive UI**

Developed for:
* **Dr. Rauf**, Consultant Neurologist, Rawalpindi, Pakistan

---

## 1. System Architecture

```text
Patient Consultation Portal/
├── frontend/                     # React + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── assets/               # Medical SVGs and assets
│   │   ├── components/
│   │   │   ├── common/           # BrandLogo, ErrorBoundary
│   │   │   └── ui/               # Button, Input, Select, SearchableSelect,
│   │   │                         # MultiSelect, Card, Dialog, ConfirmationDialog,
│   │   │                         # PageHeader, EmptyState, LoadingSkeleton,
│   │   │                         # ErrorState, ResponsiveTable
│   │   ├── context/              # AuthContext, ToastContext
│   │   ├── hooks/                # useAuth, useToast
│   │   ├── layouts/              # DashboardLayout (Sidebar/Drawer), AuthLayout
│   │   ├── pages/                # LoginPage, DashboardPage, PlaceholderModulePage, NotFoundPage
│   │   ├── routes/               # AppRoutes, ProtectedRoute, PublicRoute
│   │   ├── services/             # Centralized api.ts, authService.ts
│   │   ├── types/                # auth.ts, user.ts
│   │   ├── utils/                # cn.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/                      # Python + FastAPI + SQLAlchemy + Alembic
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/           # health.py, auth.py
│   │   │   └── deps.py           # get_db, get_current_user, require_roles
│   │   ├── core/
│   │   │   ├── config.py         # Pydantic Settings
│   │   │   └── security.py       # PBKDF2 hashing, JWT access tokens
│   │   ├── db/
│   │   │   ├── base.py           # DeclarativeBase
│   │   │   └── session.py        # PostgreSQL engine + local dev fallback
│   │   ├── models/
│   │   │   └── user.py           # User model with ADMIN, DOCTOR, STAFF roles
│   │   ├── schemas/              # auth.py, user.py, common.py
│   │   ├── services/             # auth_service.py, user_service.py
│   │   └── main.py               # FastAPI entrypoint, CORS, exception handlers
│   ├── alembic/                  # Database migration configuration
│   ├── tests/                    # Pytest test suite (health, auth, roles)
│   ├── init_db.py                # Database and seed accounts initializer
│   ├── requirements.txt
│   ├── alembic.ini
│   └── .env.example
│
└── README.md
```

---

## 2. Prerequisites

* **Node.js**: v18+ (tested on Node.js v24)
* **npm**: v9+
* **Python**: v3.10+ (tested on Python 3.12)
* **PostgreSQL**: Production target database (local SQLite automatic development fallback supported)

---

## 3. Environment Variables

### Backend Configuration (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:

```env
ENVIRONMENT=development
PROJECT_NAME="Dr. Rauf Neurology — Patient Consultation Portal"
API_PREFIX=/api

# Security & Authentication
SECRET_KEY=change_this_to_a_super_secure_random_key_in_production_min_32_chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# Database Configuration (PostgreSQL is the primary architecture)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dr_rauf_neurology

# Development Fallback: Set to True for automatic SQLite fallback if PostgreSQL is not active
USE_SQLITE_DEV_FALLBACK=True
SQLITE_DB_PATH=./dr_rauf_dev.db

# CORS Allowed Origins (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
```

---

## 4. Backend Setup & Run

### Step 1: Set up Virtual Environment & Install Dependencies

```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### Step 2: Initialize Database & Master Data

```bash
python init_db.py
```

This initializes the database schema and seeds clinical master data (symptoms, medicines, tests, etc.).
No default administrator credentials exist by default. Upon first launching the application, you will be prompted to create the initial administrator account via the setup screen (`/setup`).


### Step 3: Run Database Migrations (Alembic)

```bash
alembic upgrade head
```

### Step 4: Start the Backend Server

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Interactive API documentation will be available at:
* Swagger UI: `http://127.0.0.1:8000/api/docs`
* Health Check: `http://127.0.0.1:8000/api/health`

### Step 5: Run Automated Backend Tests

```bash
pytest
```

---

## 5. Frontend Setup & Run

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

### Step 2: Start Development Server

```bash
npm run dev
```

The portal will be accessible at: `http://localhost:5173`

### Step 3: Production Build

```bash
npm run build
```

---

## 6. How to Test the Health Endpoint

```bash
curl http://127.0.0.1:8000/api/health
```

Expected response:
```json
{
  "status": "ok"
}
```

---

## 7. Phase 1 Verification Checklist

- [x] **Backend Health Check**: `GET /api/health` returns `{"status": "ok"}`
- [x] **Authentication Flow**: JWT bearer tokens, generic failure error (`Invalid username or password.`)
- [x] **Roles Architecture**: Type model supporting `ADMIN`, `DOCTOR`, `STAFF`
- [x] **Protected Routes**: Redirection from `/dashboard` to `/login` when unauthenticated; redirection to `/dashboard` upon login
- [x] **Logout**: Complete token and context clearance, redirect to `/login`
- [x] **Responsive Navigation**: Desktop 64-width fixed sidebar; mobile animated slide-out drawer with ESC key and backdrop dismissal
- [x] **No Fake Clinical Data**: Stat cards show clean empty state `—`; Recent Activity shows empty state
- [x] **Clinical Select Foundations**:
  - `SearchableSelect`: Live search filtering with `+ Add manually` action
  - `MultiSelect`: Search and removable chips/tags
- [x] **Reusable UI Primitives**: Button (variants & loading), Input, Select, Card, PageHeader, EmptyState, Skeleton loaders, ErrorState, Dialog, ConfirmationDialog, ResponsiveTable, Toasts
- [x] **Error Boundary & 404**: Application error boundary and medical 404 page
- [x] **Placeholder Modules**: Clean placeholder pages for future phases (`/patients`, `/consultations`, `/medicines`, `/symptoms`, `/diagnostic-tests`, `/neurological-examination`, `/settings`)
