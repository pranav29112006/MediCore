-- ════════════════════════════════════════════════════════════════════════════
-- MediCore — Supabase Schema & Seed Data Migration
-- Run this in Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. Extensions ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 2. Tables ────────────────────────────────────────────────────────────────

-- Profiles (synced from auth.users on signup)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','doctor','nurse','receptionist')),
  ward_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Wards
CREATE TABLE IF NOT EXISTS wards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  floor INT NOT NULL DEFAULT 1,
  total_beds INT NOT NULL DEFAULT 20,
  occupied_beds INT NOT NULL DEFAULT 0
);

-- Patients
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  mrn TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  age INT NOT NULL,
  dob DATE,
  gender TEXT CHECK (gender IN ('male','female','other')),
  blood_group TEXT,
  contact_number TEXT,
  emergency_contact TEXT,
  address TEXT,
  admission_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  discharge_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'admitted' CHECK (status IN ('admitted','discharged','under_observation','icu')),
  ward_id TEXT REFERENCES wards(id),
  ward_name TEXT,
  room_number TEXT,
  assigned_doctor_id TEXT,
  assigned_doctor_name TEXT,
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low','medium','high','critical'))
);

-- Diagnoses
CREATE TABLE IF NOT EXISTS diagnoses (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  icd_code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  severity TEXT CHECK (severity IN ('mild','moderate','severe')),
  diagnosed_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','resolved','chronic'))
);

-- Vitals
CREATE TABLE IF NOT EXISTS vitals (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  bp_systolic INT,
  bp_diastolic INT,
  heart_rate INT,
  spo2 INT,
  temperature NUMERIC(4,1),
  respiratory_rate INT,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  recorded_by TEXT
);

-- Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  diagnosis_id TEXT REFERENCES diagnoses(id),
  medication_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  route TEXT CHECK (route IN ('oral','iv','im','topical','inhalation','subcutaneous')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','completed','discontinued')),
  prescribed_by TEXT,
  notes TEXT
);

-- Clinical Notes
CREATE TABLE IF NOT EXISTS clinical_notes (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  note_type TEXT CHECK (note_type IN ('doctor','nurse')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Risk Scores
CREATE TABLE IF NOT EXISTS risk_scores (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  score TEXT CHECK (score IN ('low','medium','high','critical')),
  numeric_score INT,
  explanation TEXT,
  factors TEXT[],
  calculated_at TIMESTAMPTZ DEFAULT now()
);

-- Alerts
CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT,
  ward_name TEXT,
  room_number TEXT,
  message TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low','medium','high','critical')),
  acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_table TEXT,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 3. Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_patients_ward ON patients(ward_id);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_risk ON patients(risk_level);
CREATE INDEX IF NOT EXISTS idx_vitals_patient ON vitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_patient ON diagnoses(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_patient ON clinical_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

-- ─── 4. RLS Policies ─────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read most tables
CREATE POLICY "Authenticated users can read wards" ON wards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read patients" ON patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read vitals" ON vitals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read diagnoses" ON diagnoses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read prescriptions" ON prescriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read notes" ON clinical_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read risk scores" ON risk_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read alerts" ON alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read profiles" ON profiles FOR SELECT TO authenticated USING (true);

-- Insert policies (role-based)
CREATE POLICY "Receptionists can register patients" ON patients FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('receptionist', 'admin'));

CREATE POLICY "Nurses can record vitals" ON vitals FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('nurse', 'doctor', 'admin'));

CREATE POLICY "Clinical staff can add notes" ON clinical_notes FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('doctor', 'nurse'));

CREATE POLICY "Doctors can add prescriptions" ON prescriptions FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('doctor', 'admin'));

-- Profile: users can update own profile
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- ─── 5. Profile Sync Trigger ─────────────────────────────────────────────────
-- Auto-create profile row when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'receptionist')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ════════════════════════════════════════════════════════════════════════════
-- DONE! Tables, indexes, RLS policies, and profile sync trigger created.
-- The seed data is generated in the frontend via src/data/seed-data.ts
-- When ready to migrate to Supabase, run a separate data import script.
-- ════════════════════════════════════════════════════════════════════════════
