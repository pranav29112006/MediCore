// ─── Core Types for MediCore Patient Data ─────────────────────────────────────

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type PatientStatus = "admitted" | "discharged" | "under_observation" | "icu";
export type Gender = "male" | "female" | "other";
export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export type NoteType = "doctor" | "nurse";

export interface Ward {
  id: string;
  name: string;
  department: string;
  floor: number;
  totalBeds: number;
  occupiedBeds: number;
}

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number e.g. MRN-2024-00001
  fullName: string;
  age: number;
  dob: string; // ISO date
  gender: Gender;
  bloodGroup: BloodGroup;
  contactNumber: string;
  emergencyContact: string;
  address: string;
  admissionDate: string; // ISO datetime
  dischargeDate: string | null;
  status: PatientStatus;
  wardId: string;
  wardName: string;
  roomNumber: string;
  assignedDoctorId: string | null;
  assignedDoctorName: string;
  riskLevel: RiskLevel;
}

export interface Diagnosis {
  id: string;
  patientId: string;
  icdCode: string;
  name: string;
  description: string;
  severity: "mild" | "moderate" | "severe";
  diagnosedDate: string;
  status: "active" | "resolved" | "chronic";
}

export interface Vital {
  id: string;
  patientId: string;
  bpSystolic: number;
  bpDiastolic: number;
  heartRate: number;
  spo2: number;
  temperature: number; // Celsius
  respiratoryRate: number;
  recordedAt: string; // ISO datetime
  recordedBy: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  diagnosisId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  route: "oral" | "iv" | "im" | "topical" | "inhalation" | "subcutaneous";
  startDate: string;
  endDate: string | null;
  status: "active" | "completed" | "discontinued";
  prescribedBy: string;
  notes: string;
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  authorName: string;
  noteType: NoteType;
  content: string;
  createdAt: string;
}

export interface RiskScore {
  id: string;
  patientId: string;
  score: RiskLevel;
  numericScore: number; // 0-100
  explanation: string;
  factors: string[];
  calculatedAt: string;
}

export interface Alert {
  id: string;
  patientId: string;
  patientName: string;
  wardName: string;
  roomNumber: string;
  message: string;
  severity: RiskLevel;
  acknowledged: boolean;
  createdAt: string;
}

export interface HospitalStats {
  totalPatients: number;
  admittedToday: number;
  dischargedToday: number;
  icuPatients: number;
  highRiskPatients: number;
  totalWards: number;
  occupancyRate: number;
  activeAlerts: number;
}
