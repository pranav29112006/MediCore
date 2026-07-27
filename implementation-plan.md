# AI Patient Risk Prediction Platform — Implementation Plan

**Repo:** `patient-risk-platform`
**Stack:** React (Vite) + FastAPI + PostgreSQL + LLM API (Claude or OpenAI)
**Timeline:** 30 days

**Build order:** Follow the phases in §10 sequentially. Each phase must be a working, testable slice before the next one starts — do not implement everything in one pass.

---

## 1. Actors

| Actor | Type | Notes |
|---|---|---|
| Admin | Human | Full oversight, no clinical actions |
| Doctor | Human | Clinical decisions, AI summary generation |
| Nurse | Human | Vitals entry, ward-level care |
| Receptionist | Human | Patient intake, no clinical access |
| AI Engine | System | Triggered by backend; not a login role |

## 2. Role Permission Matrix

| Capability | Admin | Doctor | Nurse | Receptionist |
|---|:---:|:---:|:---:|:---:|
| Login | ✅ | ✅ | ✅ | ✅ |
| Manage staff accounts | ✅ | ❌ | ❌ | ❌ |
| View hospital-wide analytics | ✅ | ❌ | ❌ | ❌ |
| View audit log | ✅ | ❌ | ❌ | ❌ |
| Register new patient | ❌ | ❌ | ❌ | ✅ |
| Assign ward/doctor | ❌ | ❌ | ❌ | ✅ |
| View patient list (basic) | ✅ | ✅ | ✅ | ✅ |
| View full clinical profile | ✅ | ✅ | ✅ | ❌ |
| Enter/update vitals | ❌ | ❌ | ✅ | ❌ |
| View risk score | ✅ | ✅ | ✅ | ❌ |
| Run/refresh risk prediction | ❌ | ✅ | ❌ | ❌ |
| Generate AI summary/discharge note | ❌ | ✅ | ❌ | ❌ |
| Add clinical notes | ❌ | ✅ | ✅* | ❌ |
| Receive high-risk alerts | ✅ all | ✅ assigned | ✅ ward | ❌ |
| Authorize discharge (clinical) | ❌ | ✅ | ❌ | ❌ |
| Close admission (release bed) | ✅ | ❌ | ❌ | ✅ |

*Nurse notes are tagged separately from doctor notes.

## 3. Frontend Routes

| Route | Access |
|---|---|
| `/login` | Public |
| `/dashboard` | All (content varies by role) |
| `/patients` | All (fields role-filtered) |
| `/patients/new` | Receptionist, Admin |
| `/patients/:id` | Admin, Doctor, Nurse |
| `/patients/:id/vitals` | Nurse (edit), Doctor/Admin (view) |
| `/patients/:id/risk` | Doctor (run), Nurse/Admin (view) |
| `/patients/:id/summary` | Doctor |
| `/alerts` | Doctor, Nurse, Admin |
| `/analytics` | Admin |
| `/admin/staff` | Admin |
| `/admin/audit-log` | Admin |

## 4. Database Schema

```
users
  id UUID (PK), name string, email string (unique), password_hash string,
  role enum[admin|doctor|nurse|receptionist], ward_id UUID (FK->wards.id, nullable), created_at timestamp

wards
  id UUID (PK), name string, department string

patients
  id UUID (PK), full_name string, dob date, gender string, contact_number string,
  admission_date timestamp, discharge_date timestamp (nullable), status enum[admitted|discharged],
  ward_id UUID (FK->wards.id), assigned_doctor_id UUID (FK->users.id), registered_by UUID (FK->users.id)

vitals
  id UUID (PK), patient_id UUID (FK->patients.id), recorded_by UUID (FK->users.id),
  bp_systolic int, bp_diastolic int, heart_rate int, spo2 int, temperature float, recorded_at timestamp

risk_scores
  id UUID (PK), patient_id UUID (FK->patients.id), score enum[low|medium|high],
  explanation text, calculated_at timestamp, triggered_by UUID (FK->users.id, nullable)

clinical_notes
  id UUID (PK), patient_id UUID (FK->patients.id), author_id UUID (FK->users.id),
  note_type enum[doctor|nurse], content text, created_at timestamp

ai_summaries
  id UUID (PK), patient_id UUID (FK->patients.id), summary_type enum[history|discharge],
  content text, generated_by UUID (FK->users.id), generated_at timestamp

alerts
  id UUID (PK), patient_id UUID (FK->patients.id), risk_score_id UUID (FK->risk_scores.id, nullable),
  message string, severity enum[low|medium|high], acknowledged bool, created_at timestamp

audit_logs
  id UUID (PK), user_id UUID (FK->users.id), action string, target_table string, target_id UUID, timestamp timestamp
```

## 5. API Endpoints

```
AUTH
POST   /auth/login
GET    /auth/me

USERS                          (admin only)
GET    /users
POST   /users
PATCH  /users/:id
DELETE /users/:id

PATIENTS
GET    /patients               role-filtered fields
POST   /patients               receptionist, admin
GET    /patients/:id           role-filtered fields
PATCH  /patients/:id           receptionist/admin: demographics · doctor: discharge auth

VITALS
POST   /patients/:id/vitals    nurse
GET    /patients/:id/vitals    doctor, nurse, admin

RISK
POST   /patients/:id/risk/calculate   doctor (manual) · system (auto on new vitals)
GET    /patients/:id/risk             doctor, nurse, admin

AI SUMMARY
POST   /patients/:id/summary   doctor · body: { type: "history" | "discharge" }
GET    /patients/:id/summary   doctor

NOTES
POST   /patients/:id/notes     doctor, nurse
GET    /patients/:id/notes     doctor, nurse, admin

ALERTS
GET    /alerts                 doctor: assigned · nurse: ward · admin: all
PATCH  /alerts/:id/acknowledge

ANALYTICS                      (admin)
GET    /analytics/overview
GET    /analytics/risk-distribution

AUDIT                          (admin)
GET    /audit-logs
```

## 6. Risk Engine Logic

- Rule-based scoring (NEWS2-style): weight BP, HR, SpO2, and temperature deviations from normal range → numeric score → map to Low/Medium/High.
- On score calculation, call the LLM once with `{vitals, score, band}` → return a 1–2 sentence plain-English explanation. Store in `risk_scores.explanation`.
- Auto-trigger: new vitals row → recalculate risk → if High, insert into `alerts`.

## 7. AI Integration Points

| Feature | Trigger | Input | Output |
|---|---|---|---|
| Risk explanation | After score calculation | vitals + score | 1–2 sentence explanation |
| History summary | Doctor clicks "Summarize" | notes + vitals timeline | structured summary |
| Discharge note | Doctor clicks "Generate Discharge Note" | full stay data | draft note (doctor edits before finalizing) |

Isolate all LLM calls in one `ai_service` module — keeps the provider swap-friendly.

## 8. Auth & RBAC

- JWT payload: `{ user_id, role, ward_id, exp }`
- Backend: `Depends(require_role("doctor"))` per route
- Frontend: `<ProtectedRoute allow={["doctor","admin"]}>` wrapper on each route

## 9. Folder Structure

```
backend/
  app/
    main.py
    models/
    schemas/
    routers/     auth, users, patients, vitals, risk, summaries, alerts, analytics, audit
    services/    ai_service.py, risk_engine.py
    core/        security.py, deps.py, config.py
    db/          session.py, base.py
  requirements.txt

frontend/
  src/
    pages/
    components/
    routes/      ProtectedRoute.jsx
    context/     AuthContext.jsx
    api/         axios instance + endpoint calls
```

## 10. Build Phases (30 Days)

| Phase | Days | Scope |
|---|---|---|
| 1 — Foundations | 1–4 | DB models, JWT auth, role middleware, seed 1 admin |
| 2 — Staff & Patients | 5–9 | Admin user CRUD, receptionist patient registration, ward/doctor assignment |
| 3 — Vitals & Risk | 10–14 | Nurse vitals entry, rule-based risk engine, risk history view |
| 4 — AI Layer | 15–19 | LLM risk explanation, history summary, discharge note generation |
| 5 — Dashboards & Alerts | 20–24 | Role-based dashboards, alert triggers/acknowledgment, admin analytics |
| 6 — Deploy & Polish | 25–30 | Responsive pass, route guard hardening, deploy, README |

## 11. Deployment

- **Frontend:** Vercel — set `VITE_API_BASE_URL`
- **Backend:** Render or Railway — set `DATABASE_URL`, `JWT_SECRET`, `AI_API_KEY`
- Enable CORS on FastAPI for the Vercel domain
- One GitHub repo, two folders (`/frontend`, `/backend`) — simplest for a single Vercel + single Render/Railway deploy
