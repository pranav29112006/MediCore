// ─── Data Service Layer ───────────────────────────────────────────────────────
// Central query layer for all patient data. Currently reads from local seed data.
// When Supabase tables are set up, swap implementations here — all consumers stay unchanged.

import {
  PATIENTS, DIAGNOSES, VITALS, PRESCRIPTIONS, CLINICAL_NOTES,
  RISK_SCORES, ALERTS, WARDS,
  TOTAL_PATIENTS, ADMITTED_PATIENTS, DISCHARGED_PATIENTS,
  ICU_PATIENTS, HIGH_RISK_PATIENTS, UNACKNOWLEDGED_ALERTS,
} from "../data/seed-data";
import type {
  Patient, Diagnosis, Vital, Prescription, ClinicalNote,
  RiskScore, Alert, Ward, HospitalStats, PatientStatus, RiskLevel,
} from "./types";

// ─── Patients ─────────────────────────────────────────────────────────────────

// In-memory store for new patients added via registration
const _addedPatients: Patient[] = [];
const _addedVitals: Vital[] = [];
const _addedNotes: ClinicalNote[] = [];

function allPatients(): Patient[] {
  return [...PATIENTS, ..._addedPatients];
}

export function getPatients(filters?: {
  status?: PatientStatus;
  wardId?: string;
  riskLevel?: RiskLevel;
  doctorId?: string;
  search?: string;
  limit?: number;
}): Patient[] {
  let result = allPatients();

  if (filters?.status) {
    result = result.filter(p => p.status === filters.status);
  }
  if (filters?.wardId) {
    result = result.filter(p => p.wardId === filters.wardId);
  }
  if (filters?.riskLevel) {
    result = result.filter(p => p.riskLevel === filters.riskLevel);
  }
  if (filters?.doctorId) {
    result = result.filter(p => p.assignedDoctorId === filters.doctorId);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(p =>
      p.fullName.toLowerCase().includes(q) ||
      p.mrn.toLowerCase().includes(q) ||
      p.contactNumber.includes(q) ||
      p.wardName.toLowerCase().includes(q) ||
      p.roomNumber.toLowerCase().includes(q)
    );
  }
  if (filters?.limit) {
    result = result.slice(0, filters.limit);
  }

  return result;
}

export function getPatientById(id: string): Patient | undefined {
  return allPatients().find(p => p.id === id);
}

export function getPatientsByWard(wardId: string): Patient[] {
  return allPatients().filter(p => p.wardId === wardId && p.status !== "discharged");
}

export function getActivePatients(): Patient[] {
  return allPatients().filter(p => p.status !== "discharged");
}

export function getRecentAdmissions(days = 1): Patient[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return allPatients().filter(p => new Date(p.admissionDate) >= cutoff);
}

export function addPatient(patient: Omit<Patient, "id" | "mrn">): Patient {
  const id = `pat-${String(allPatients().length + 1).padStart(5, "0")}`;
  const mrn = `MRN-2026-${String(allPatients().length + 1).padStart(5, "0")}`;
  const newPatient: Patient = { ...patient, id, mrn } as Patient;
  _addedPatients.push(newPatient);
  return newPatient;
}

// ─── Vitals ───────────────────────────────────────────────────────────────────

function allVitals(): Vital[] {
  return [...VITALS, ..._addedVitals];
}

export function getVitals(patientId: string): Vital[] {
  return allVitals()
    .filter(v => v.patientId === patientId)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
}

export function getLatestVitals(patientId: string): Vital | undefined {
  const all = getVitals(patientId);
  return all.length ? all[all.length - 1] : undefined;
}

export function getRecentVitalsByWard(wardId: string): (Vital & { patientName: string; roomNumber: string })[] {
  const wardPatients = getPatientsByWard(wardId);
  const result: (Vital & { patientName: string; roomNumber: string })[] = [];

  for (const p of wardPatients) {
    const latest = getLatestVitals(p.id);
    if (latest) {
      result.push({ ...latest, patientName: p.fullName, roomNumber: p.roomNumber });
    }
  }

  return result.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
}

export function addVital(vital: Omit<Vital, "id">): Vital {
  const id = `vit-${String(allVitals().length + 1).padStart(6, "0")}`;
  const newVital: Vital = { ...vital, id };
  _addedVitals.push(newVital);
  return newVital;
}

// ─── Diagnoses ────────────────────────────────────────────────────────────────

export function getDiagnoses(patientId: string): Diagnosis[] {
  return DIAGNOSES.filter(d => d.patientId === patientId);
}

// ─── Prescriptions ────────────────────────────────────────────────────────────

export function getPrescriptions(patientId: string): Prescription[] {
  return PRESCRIPTIONS.filter(p => p.patientId === patientId);
}

export function getActivePrescriptions(patientId: string): Prescription[] {
  return PRESCRIPTIONS.filter(p => p.patientId === patientId && p.status === "active");
}

// ─── Clinical Notes ───────────────────────────────────────────────────────────

function allNotes(): ClinicalNote[] {
  return [...CLINICAL_NOTES, ..._addedNotes];
}

export function getClinicalNotes(patientId: string): ClinicalNote[] {
  return allNotes()
    .filter(n => n.patientId === patientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addClinicalNote(note: Omit<ClinicalNote, "id">): ClinicalNote {
  const id = `note-${String(allNotes().length + 1).padStart(5, "0")}`;
  const newNote: ClinicalNote = { ...note, id };
  _addedNotes.push(newNote);
  return newNote;
}

// ─── Risk Scores ──────────────────────────────────────────────────────────────

export function getRiskScore(patientId: string): RiskScore | undefined {
  return RISK_SCORES.find(r => r.patientId === patientId);
}

export function getRiskDistribution(): Record<RiskLevel, number> {
  const active = getActivePatients();
  const dist: Record<RiskLevel, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const p of active) {
    dist[p.riskLevel]++;
  }
  return dist;
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export function getAlerts(filters?: {
  wardName?: string;
  doctorId?: string;
  acknowledged?: boolean;
  severity?: RiskLevel;
}): Alert[] {
  let result = [...ALERTS];

  if (filters?.wardName) {
    result = result.filter(a => a.wardName === filters.wardName);
  }
  if (filters?.doctorId) {
    const doctorPatients = allPatients().filter(p => p.assignedDoctorId === filters.doctorId);
    const patientIds = new Set(doctorPatients.map(p => p.id));
    result = result.filter(a => patientIds.has(a.patientId));
  }
  if (filters?.acknowledged !== undefined) {
    result = result.filter(a => a.acknowledged === filters.acknowledged);
  }
  if (filters?.severity) {
    result = result.filter(a => a.severity === filters.severity);
  }

  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function acknowledgeAlert(alertId: string): void {
  const alert = ALERTS.find(a => a.id === alertId);
  if (alert) alert.acknowledged = true;
}

// ─── Wards ────────────────────────────────────────────────────────────────────

export function getWards(): Ward[] {
  return WARDS;
}

export function getWardById(id: string): Ward | undefined {
  return WARDS.find(w => w.id === id);
}

export function getWardOccupancy(): { name: string; occupied: number; total: number; percent: number }[] {
  return WARDS.map(w => ({
    name: w.name,
    occupied: w.occupiedBeds,
    total: w.totalBeds,
    percent: Math.round((w.occupiedBeds / w.totalBeds) * 100),
  }));
}

// ─── Hospital Stats ───────────────────────────────────────────────────────────

export function getHospitalStats(): HospitalStats {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const admittedToday = allPatients().filter(p => {
    const d = new Date(p.admissionDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  }).length;
  const dischargedToday = allPatients().filter(p => {
    if (!p.dischargeDate) return false;
    const d = new Date(p.dischargeDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  }).length;

  const totalBeds = WARDS.reduce((s, w) => s + w.totalBeds, 0);
  const occupiedBeds = WARDS.reduce((s, w) => s + w.occupiedBeds, 0);

  return {
    totalPatients: TOTAL_PATIENTS + _addedPatients.length,
    admittedToday: admittedToday || Math.min(12, Math.floor(ADMITTED_PATIENTS * 0.04)),
    dischargedToday: dischargedToday || Math.min(8, DISCHARGED_PATIENTS),
    icuPatients: ICU_PATIENTS,
    highRiskPatients: HIGH_RISK_PATIENTS,
    totalWards: WARDS.length,
    occupancyRate: Math.round((occupiedBeds / totalBeds) * 100),
    activeAlerts: UNACKNOWLEDGED_ALERTS,
  };
}

// ─── Search ───────────────────────────────────────────────────────────────────

export function searchPatients(query: string): Patient[] {
  if (!query || query.length < 2) return [];
  return getPatients({ search: query, limit: 20 });
}

// ─── Department Stats ─────────────────────────────────────────────────────────

export function getDepartmentStats(): { department: string; wardId: string; admitted: number; critical: number; occupancy: number }[] {
  return WARDS.map(w => {
    const wardPatients = getPatientsByWard(w.id);
    return {
      department: w.department,
      wardId: w.id,
      admitted: wardPatients.length,
      critical: wardPatients.filter(p => p.riskLevel === "critical" || p.riskLevel === "high").length,
      occupancy: Math.round((w.occupiedBeds / w.totalBeds) * 100),
    };
  });
}

// ─── Prescription Letters ─────────────────────────────────────────────────────

import { getLettersForPatient, hasPatientLetters } from "../data/prescription-data";
import type { PrescriptionLetter } from "./types";

export function getPrescriptionLetters(patientId: string): PrescriptionLetter[] {
  return getLettersForPatient(patientId);
}

export function patientHasPrescriptionLetters(patientId: string): boolean {
  return hasPatientLetters(patientId);
}

