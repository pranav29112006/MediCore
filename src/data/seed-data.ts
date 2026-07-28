// ─── Seed Data Generator — ~200 Patients, 15 Departments, Realistic Data ────
// Deterministic generation: same data every time for consistency
import type {
  Ward, Patient, Diagnosis, Vital, Prescription,
  ClinicalNote, RiskScore, Alert, Gender, BloodGroup,
  PatientStatus, RiskLevel,
} from "../lib/types";

// ─── Seeded PRNG (Mulberry32) ─────────────────────────────────────────────────
let _seed = 42;
function rand(): number {
  _seed |= 0; _seed = _seed + 0x6D2B79F5 | 0;
  let t = Math.imul(_seed ^ _seed >>> 15, 1 | _seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
function randInt(min: number, max: number) { return Math.floor(rand() * (max - min + 1)) + min; }
function pick<T>(arr: T[]): T { return arr[randInt(0, arr.length - 1)]; }
function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => rand() - 0.5);
  return shuffled.slice(0, n);
}
function uuid(i: number): string {
  const hex = i.toString(16).padStart(8, "0");
  return `${hex.slice(0,8)}-${hex.slice(0,4)}-4${hex.slice(1,4)}-a${hex.slice(1,4)}-${hex.padStart(12,"0")}`;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const NOW = new Date("2026-07-28T09:00:00+05:30");
function daysAgo(d: number, hourOffset = 0): string {
  const dt = new Date(NOW);
  dt.setDate(dt.getDate() - d);
  dt.setHours(dt.getHours() + hourOffset);
  return dt.toISOString();
}

const BLOOD_GROUPS: BloodGroup[] = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

const MALE_FIRST = [
  "Aarav","Vivaan","Aditya","Vihaan","Arjun","Sai","Reyansh","Ayaan","Krishna","Ishaan",
  "Shaurya","Atharva","Advait","Dhruv","Kabir","Ritvik","Aayansh","Arnav","Rudra","Daksh",
  "Rohan","Karthik","Pranav","Amit","Rajesh","Suresh","Mahesh","Ganesh","Vikram","Ajay",
  "Ravi","Sanjay","Deepak","Manoj","Ashok","Rahul","Nikhil","Sahil","Kunal","Tarun",
  "Gaurav","Varun","Mohit","Harish","Naveen","Pankaj","Sumit","Ankit","Vishal","Arun",
];
const FEMALE_FIRST = [
  "Ananya","Diya","Myra","Sara","Aanya","Aadhya","Aarohi","Saanvi","Pari","Anika",
  "Navya","Angel","Avni","Kiara","Mira","Riya","Priya","Neha","Kavya","Isha",
  "Pooja","Sneha","Divya","Anjali","Meera","Shruti","Nisha","Tanvi","Sakshi","Rashmi",
  "Swati","Sonia","Archana","Bhavna","Chitra","Deepa","Esha","Falguni","Gauri","Heena",
  "Jaya","Kiran","Lakshmi","Manju","Nandini","Padma","Radha","Sunita","Usha","Vidya",
];
const LAST_NAMES = [
  "Sharma","Verma","Gupta","Singh","Kumar","Patel","Reddy","Nair","Iyer","Joshi",
  "Mehta","Shah","Chauhan","Yadav","Mishra","Pandey","Dubey","Saxena","Agarwal","Bhat",
  "Rao","Pillai","Menon","Shetty","Hegde","Kulkarni","Deshmukh","Patil","Pawar","More",
  "Das","Sen","Roy","Banerjee","Chatterjee","Mukherjee","Ghosh","Bose","Dutta","Sarkar",
];

const DOCTOR_NAMES = [
  "Dr. Anand Sharma","Dr. Priya Patel","Dr. Rajesh Kumar","Dr. Meera Nair",
  "Dr. Vikram Singh","Dr. Kavya Reddy","Dr. Suresh Iyer","Dr. Anjali Gupta",
  "Dr. Deepak Joshi","Dr. Sneha Mehta","Dr. Karthik Rao","Dr. Divya Menon",
  "Dr. Rahul Verma","Dr. Lakshmi Pillai","Dr. Amit Chauhan",
];

const NURSE_NAMES = [
  "Nurse Sunita Das","Nurse Rekha Yadav","Nurse Pooja Mishra","Nurse Geeta Pandey",
  "Nurse Suman Dubey","Nurse Anita Saxena","Nurse Kavita Agarwal","Nurse Renu Bhat",
];

// ─── Ward Definitions ─────────────────────────────────────────────────────────
export const WARDS: Ward[] = [
  { id: "ward-01", name: "Cardiac Care Unit",   department: "Cardiology",              floor: 3, totalBeds: 30, occupiedBeds: 0 },
  { id: "ward-02", name: "Neuro Ward",          department: "Neurology",               floor: 4, totalBeds: 25, occupiedBeds: 0 },
  { id: "ward-03", name: "Ortho Ward",          department: "Orthopedics",             floor: 2, totalBeds: 28, occupiedBeds: 0 },
  { id: "ward-04", name: "Respiratory Unit",    department: "Pulmonology",             floor: 3, totalBeds: 26, occupiedBeds: 0 },
  { id: "ward-05", name: "GI Ward",             department: "Gastroenterology",        floor: 2, totalBeds: 22, occupiedBeds: 0 },
  { id: "ward-06", name: "Oncology Unit",       department: "Oncology",                floor: 5, totalBeds: 24, occupiedBeds: 0 },
  { id: "ward-07", name: "Renal Ward",          department: "Nephrology",              floor: 4, totalBeds: 20, occupiedBeds: 0 },
  { id: "ward-08", name: "Endo Ward",           department: "Endocrinology",           floor: 3, totalBeds: 18, occupiedBeds: 0 },
  { id: "ward-09", name: "Pediatric Ward",      department: "Pediatrics",              floor: 1, totalBeds: 30, occupiedBeds: 0 },
  { id: "ward-10", name: "OB/GYN Ward",         department: "Obstetrics & Gynecology", floor: 2, totalBeds: 25, occupiedBeds: 0 },
  { id: "ward-11", name: "Surgical Ward",       department: "General Surgery",         floor: 2, totalBeds: 28, occupiedBeds: 0 },
  { id: "ward-12", name: "Psych Unit",          department: "Psychiatry",              floor: 5, totalBeds: 16, occupiedBeds: 0 },
  { id: "ward-13", name: "Derm Clinic",         department: "Dermatology",             floor: 1, totalBeds: 12, occupiedBeds: 0 },
  { id: "ward-14", name: "ER / Trauma",         department: "Emergency Medicine",      floor: 0, totalBeds: 30, occupiedBeds: 0 },
  { id: "ward-15", name: "Intensive Care Unit",  department: "ICU",                    floor: 3, totalBeds: 20, occupiedBeds: 0 },
];

// ─── Disease Templates per Department ─────────────────────────────────────────
interface DiseaseTemplate {
  name: string;
  icdCode: string;
  description: string;
  severity: "mild" | "moderate" | "severe";
  vitalDeviations: { bpSys?: [number,number]; bpDia?: [number,number]; hr?: [number,number]; spo2?: [number,number]; temp?: [number,number]; rr?: [number,number] };
  prescriptions: { med: string; dose: string; freq: string; route: Prescription["route"] }[];
  riskLevel: RiskLevel;
  deteriorating?: boolean;
}

const DISEASE_MAP: Record<string, DiseaseTemplate[]> = {
  "ward-01": [ // Cardiology
    { name: "Acute Myocardial Infarction", icdCode: "I21.9", description: "Acute heart attack with ST-elevation", severity: "severe",
      vitalDeviations: { bpSys: [90,110], bpDia: [55,70], hr: [100,130], spo2: [88,94], temp: [37,38], rr: [22,28] },
      prescriptions: [{ med: "Aspirin", dose: "325mg", freq: "STAT then 81mg daily", route: "oral" },{ med: "Clopidogrel", dose: "300mg", freq: "Loading then 75mg daily", route: "oral" },{ med: "Heparin", dose: "5000 IU", freq: "Q12H", route: "iv" },{ med: "Atorvastatin", dose: "80mg", freq: "Once daily", route: "oral" }],
      riskLevel: "critical", deteriorating: true },
    { name: "Congestive Heart Failure", icdCode: "I50.9", description: "Decompensated heart failure with pulmonary edema", severity: "severe",
      vitalDeviations: { bpSys: [85,105], bpDia: [50,65], hr: [95,120], spo2: [86,92], temp: [36.5,37.5], rr: [24,32] },
      prescriptions: [{ med: "Furosemide", dose: "40mg", freq: "BID", route: "iv" },{ med: "Enalapril", dose: "5mg", freq: "BID", route: "oral" },{ med: "Carvedilol", dose: "6.25mg", freq: "BID", route: "oral" }],
      riskLevel: "high", deteriorating: true },
    { name: "Atrial Fibrillation", icdCode: "I48.91", description: "Rapid atrial fibrillation with irregular rhythm", severity: "moderate",
      vitalDeviations: { bpSys: [110,140], bpDia: [65,85], hr: [110,160], spo2: [93,97], temp: [36.5,37.2], rr: [18,24] },
      prescriptions: [{ med: "Amiodarone", dose: "200mg", freq: "TID for 1 week then daily", route: "oral" },{ med: "Rivaroxaban", dose: "20mg", freq: "Once daily", route: "oral" }],
      riskLevel: "medium" },
    { name: "Hypertensive Crisis", icdCode: "I16.1", description: "Severe hypertension with end-organ damage risk", severity: "severe",
      vitalDeviations: { bpSys: [180,220], bpDia: [110,130], hr: [90,110], spo2: [94,97], temp: [36.8,37.5], rr: [20,26] },
      prescriptions: [{ med: "Labetalol", dose: "20mg", freq: "IV bolus, then infusion", route: "iv" },{ med: "Amlodipine", dose: "10mg", freq: "Once daily", route: "oral" }],
      riskLevel: "high" },
  ],
  "ward-02": [ // Neurology
    { name: "Acute Ischemic Stroke", icdCode: "I63.9", description: "Left MCA territory infarct with hemiparesis", severity: "severe",
      vitalDeviations: { bpSys: [160,200], bpDia: [90,110], hr: [80,100], spo2: [93,97], temp: [37,38.5], rr: [18,24] },
      prescriptions: [{ med: "Alteplase (tPA)", dose: "0.9mg/kg", freq: "STAT", route: "iv" },{ med: "Aspirin", dose: "325mg", freq: "Daily after 24h", route: "oral" }],
      riskLevel: "critical", deteriorating: true },
    { name: "Status Epilepticus", icdCode: "G41.9", description: "Continuous seizure activity >5 minutes", severity: "severe",
      vitalDeviations: { bpSys: [130,170], bpDia: [80,100], hr: [100,140], spo2: [85,93], temp: [38,39.5], rr: [24,34] },
      prescriptions: [{ med: "Lorazepam", dose: "4mg", freq: "STAT IV", route: "iv" },{ med: "Levetiracetam", dose: "1500mg", freq: "BID", route: "iv" }],
      riskLevel: "critical" },
    { name: "Bacterial Meningitis", icdCode: "G00.9", description: "Acute meningitis with neck rigidity and fever", severity: "severe",
      vitalDeviations: { bpSys: [100,130], bpDia: [60,80], hr: [100,120], spo2: [93,97], temp: [39,40.5], rr: [20,28] },
      prescriptions: [{ med: "Ceftriaxone", dose: "2g", freq: "Q12H", route: "iv" },{ med: "Vancomycin", dose: "1g", freq: "Q12H", route: "iv" },{ med: "Dexamethasone", dose: "0.15mg/kg", freq: "Q6H", route: "iv" }],
      riskLevel: "high", deteriorating: true },
    { name: "Parkinson's Disease Exacerbation", icdCode: "G20", description: "Worsening tremor and rigidity with falls", severity: "moderate",
      vitalDeviations: { bpSys: [100,130], bpDia: [60,80], hr: [65,85], spo2: [95,98], temp: [36.5,37.2], rr: [16,20] },
      prescriptions: [{ med: "Levodopa/Carbidopa", dose: "250/25mg", freq: "TID", route: "oral" },{ med: "Ropinirole", dose: "2mg", freq: "TID", route: "oral" }],
      riskLevel: "medium" },
  ],
  "ward-03": [ // Orthopedics
    { name: "Femoral Neck Fracture", icdCode: "S72.001A", description: "Right femoral neck fracture from fall", severity: "moderate",
      vitalDeviations: { bpSys: [110,135], bpDia: [65,80], hr: [80,100], spo2: [95,98], temp: [36.8,37.5], rr: [16,20] },
      prescriptions: [{ med: "Morphine", dose: "4mg", freq: "Q4H PRN", route: "iv" },{ med: "Enoxaparin", dose: "40mg", freq: "Daily", route: "subcutaneous" },{ med: "Cefazolin", dose: "2g", freq: "Pre-op", route: "iv" }],
      riskLevel: "medium" },
    { name: "Total Knee Replacement - Post-Op", icdCode: "Z96.651", description: "Day 2 post bilateral TKR", severity: "mild",
      vitalDeviations: { bpSys: [115,135], bpDia: [70,85], hr: [75,95], spo2: [95,98], temp: [37,37.8], rr: [16,20] },
      prescriptions: [{ med: "Tramadol", dose: "50mg", freq: "Q6H", route: "oral" },{ med: "Rivaroxaban", dose: "10mg", freq: "Daily", route: "oral" }],
      riskLevel: "low" },
    { name: "Spinal Cord Injury", icdCode: "S14.109A", description: "Cervical spinal injury with partial paralysis", severity: "severe",
      vitalDeviations: { bpSys: [85,105], bpDia: [50,65], hr: [55,70], spo2: [90,95], temp: [36,37], rr: [18,24] },
      prescriptions: [{ med: "Methylprednisolone", dose: "30mg/kg", freq: "STAT", route: "iv" },{ med: "Gabapentin", dose: "300mg", freq: "TID", route: "oral" }],
      riskLevel: "high", deteriorating: true },
  ],
  "ward-04": [ // Pulmonology
    { name: "COPD Acute Exacerbation", icdCode: "J44.1", description: "Severe COPD exacerbation with respiratory distress", severity: "severe",
      vitalDeviations: { bpSys: [130,155], bpDia: [80,95], hr: [100,120], spo2: [84,91], temp: [37.5,38.5], rr: [26,36] },
      prescriptions: [{ med: "Salbutamol Nebulization", dose: "5mg", freq: "Q4H", route: "inhalation" },{ med: "Prednisolone", dose: "40mg", freq: "Daily", route: "oral" },{ med: "Azithromycin", dose: "500mg", freq: "Daily", route: "oral" }],
      riskLevel: "high", deteriorating: true },
    { name: "Community-Acquired Pneumonia", icdCode: "J18.9", description: "Right lower lobe pneumonia with consolidation", severity: "moderate",
      vitalDeviations: { bpSys: [105,125], bpDia: [65,80], hr: [90,110], spo2: [90,95], temp: [38.5,39.5], rr: [22,28] },
      prescriptions: [{ med: "Amoxicillin-Clavulanate", dose: "1.2g", freq: "TID", route: "iv" },{ med: "Azithromycin", dose: "500mg", freq: "Daily", route: "iv" }],
      riskLevel: "medium" },
    { name: "Acute Asthma Exacerbation", icdCode: "J45.901", description: "Severe bronchospasm with wheezing", severity: "moderate",
      vitalDeviations: { bpSys: [120,140], bpDia: [75,90], hr: [100,125], spo2: [88,94], temp: [36.8,37.5], rr: [24,32] },
      prescriptions: [{ med: "Salbutamol", dose: "5mg", freq: "Q20min x3 then Q4H", route: "inhalation" },{ med: "Ipratropium", dose: "0.5mg", freq: "Q4H", route: "inhalation" },{ med: "Hydrocortisone", dose: "100mg", freq: "Q8H", route: "iv" }],
      riskLevel: "medium" },
    { name: "Pulmonary Tuberculosis", icdCode: "A15.0", description: "Smear-positive pulmonary TB, category I", severity: "moderate",
      vitalDeviations: { bpSys: [100,120], bpDia: [60,75], hr: [85,100], spo2: [92,96], temp: [37.5,38.5], rr: [18,24] },
      prescriptions: [{ med: "Isoniazid", dose: "300mg", freq: "Daily", route: "oral" },{ med: "Rifampicin", dose: "600mg", freq: "Daily", route: "oral" },{ med: "Pyrazinamide", dose: "1500mg", freq: "Daily", route: "oral" },{ med: "Ethambutol", dose: "1200mg", freq: "Daily", route: "oral" }],
      riskLevel: "medium" },
  ],
  "ward-05": [ // Gastroenterology
    { name: "Acute Pancreatitis", icdCode: "K85.9", description: "Gallstone pancreatitis with elevated lipase", severity: "severe",
      vitalDeviations: { bpSys: [95,115], bpDia: [55,70], hr: [100,120], spo2: [93,97], temp: [38,39], rr: [20,26] },
      prescriptions: [{ med: "Normal Saline", dose: "250ml/hr", freq: "Continuous", route: "iv" },{ med: "Pantoprazole", dose: "40mg", freq: "BID", route: "iv" },{ med: "Morphine", dose: "4mg", freq: "Q4H PRN", route: "iv" }],
      riskLevel: "high" },
    { name: "Peptic Ulcer with GI Bleed", icdCode: "K25.4", description: "Gastric ulcer with hematemesis", severity: "severe",
      vitalDeviations: { bpSys: [85,105], bpDia: [50,65], hr: [105,125], spo2: [93,96], temp: [36.5,37.5], rr: [20,26] },
      prescriptions: [{ med: "Pantoprazole", dose: "80mg bolus then 8mg/hr", freq: "Continuous", route: "iv" },{ med: "Packed RBCs", dose: "2 units", freq: "STAT", route: "iv" }],
      riskLevel: "high", deteriorating: true },
    { name: "Liver Cirrhosis - Decompensated", icdCode: "K74.60", description: "Alcoholic cirrhosis with ascites and jaundice", severity: "severe",
      vitalDeviations: { bpSys: [90,110], bpDia: [50,65], hr: [85,105], spo2: [93,96], temp: [37,38], rr: [18,24] },
      prescriptions: [{ med: "Spironolactone", dose: "100mg", freq: "Daily", route: "oral" },{ med: "Furosemide", dose: "40mg", freq: "Daily", route: "oral" },{ med: "Lactulose", dose: "30ml", freq: "TID", route: "oral" }],
      riskLevel: "high" },
  ],
  "ward-06": [ // Oncology
    { name: "Breast Cancer Stage III", icdCode: "C50.912", description: "Locally advanced breast carcinoma, post chemo cycle 4", severity: "severe",
      vitalDeviations: { bpSys: [95,115], bpDia: [55,70], hr: [80,100], spo2: [94,97], temp: [36.5,38], rr: [16,22] },
      prescriptions: [{ med: "Ondansetron", dose: "8mg", freq: "Q8H", route: "iv" },{ med: "Filgrastim", dose: "5mcg/kg", freq: "Daily", route: "subcutaneous" },{ med: "Dexamethasone", dose: "8mg", freq: "BID", route: "iv" }],
      riskLevel: "medium" },
    { name: "Non-Small Cell Lung Cancer", icdCode: "C34.90", description: "Stage IIIB NSCLC with pleural effusion", severity: "severe",
      vitalDeviations: { bpSys: [100,120], bpDia: [60,75], hr: [90,110], spo2: [87,93], temp: [37,38], rr: [22,28] },
      prescriptions: [{ med: "Carboplatin", dose: "AUC 5", freq: "Q21 days", route: "iv" },{ med: "Pembrolizumab", dose: "200mg", freq: "Q21 days", route: "iv" }],
      riskLevel: "high", deteriorating: true },
    { name: "Acute Lymphoblastic Leukemia", icdCode: "C91.00", description: "ALL with pancytopenia, induction phase", severity: "severe",
      vitalDeviations: { bpSys: [90,110], bpDia: [55,70], hr: [95,115], spo2: [93,97], temp: [37.5,39], rr: [18,24] },
      prescriptions: [{ med: "Vincristine", dose: "1.4mg/m²", freq: "Weekly", route: "iv" },{ med: "Prednisone", dose: "60mg/m²", freq: "Daily", route: "oral" },{ med: "Fluconazole", dose: "200mg", freq: "Daily", route: "oral" }],
      riskLevel: "high" },
  ],
  "ward-07": [ // Nephrology
    { name: "Acute Kidney Injury", icdCode: "N17.9", description: "AKI stage 3 with oliguria, Cr 5.2", severity: "severe",
      vitalDeviations: { bpSys: [150,180], bpDia: [90,110], hr: [90,110], spo2: [93,96], temp: [37,38], rr: [22,28] },
      prescriptions: [{ med: "Calcium Gluconate", dose: "10ml of 10%", freq: "STAT", route: "iv" },{ med: "Sodium Bicarbonate", dose: "50mEq", freq: "PRN", route: "iv" }],
      riskLevel: "critical", deteriorating: true },
    { name: "Chronic Kidney Disease Stage V", icdCode: "N18.5", description: "ESRD on maintenance hemodialysis", severity: "moderate",
      vitalDeviations: { bpSys: [140,170], bpDia: [85,100], hr: [80,100], spo2: [93,96], temp: [36.5,37.5], rr: [18,22] },
      prescriptions: [{ med: "Erythropoietin", dose: "4000 IU", freq: "3x/week", route: "subcutaneous" },{ med: "Sevelamer", dose: "800mg", freq: "TID", route: "oral" },{ med: "Calcitriol", dose: "0.25mcg", freq: "Daily", route: "oral" }],
      riskLevel: "medium" },
    { name: "Nephrotic Syndrome", icdCode: "N04.9", description: "Massive proteinuria with edema and hypoalbuminemia", severity: "moderate",
      vitalDeviations: { bpSys: [120,145], bpDia: [75,90], hr: [75,95], spo2: [94,97], temp: [36.5,37.5], rr: [16,22] },
      prescriptions: [{ med: "Prednisolone", dose: "1mg/kg", freq: "Daily", route: "oral" },{ med: "Furosemide", dose: "40mg", freq: "BID", route: "oral" }],
      riskLevel: "medium" },
  ],
  "ward-08": [ // Endocrinology
    { name: "Diabetic Ketoacidosis", icdCode: "E10.10", description: "DKA with blood glucose 450, pH 7.15", severity: "severe",
      vitalDeviations: { bpSys: [90,110], bpDia: [55,70], hr: [110,130], spo2: [94,97], temp: [37,38.5], rr: [28,36] },
      prescriptions: [{ med: "Insulin Regular", dose: "0.1 U/kg/hr", freq: "Continuous infusion", route: "iv" },{ med: "Normal Saline", dose: "1L/hr", freq: "First 2h then 500ml/hr", route: "iv" },{ med: "Potassium Chloride", dose: "20mEq/L", freq: "In each liter of fluids", route: "iv" }],
      riskLevel: "critical", deteriorating: true },
    { name: "Thyroid Storm", icdCode: "E05.91", description: "Thyrotoxic crisis with fever and tachycardia", severity: "severe",
      vitalDeviations: { bpSys: [140,170], bpDia: [80,95], hr: [130,160], spo2: [93,96], temp: [39,41], rr: [24,32] },
      prescriptions: [{ med: "Propylthiouracil", dose: "200mg", freq: "Q4H", route: "oral" },{ med: "Propranolol", dose: "60mg", freq: "Q6H", route: "oral" },{ med: "Hydrocortisone", dose: "100mg", freq: "Q8H", route: "iv" }],
      riskLevel: "critical" },
    { name: "Addisonian Crisis", icdCode: "E27.2", description: "Acute adrenal insufficiency with hypotension", severity: "severe",
      vitalDeviations: { bpSys: [70,90], bpDia: [40,55], hr: [100,120], spo2: [93,96], temp: [36,37], rr: [20,26] },
      prescriptions: [{ med: "Hydrocortisone", dose: "100mg", freq: "STAT then Q8H", route: "iv" },{ med: "Normal Saline + Dextrose", dose: "1L", freq: "Over 1 hour", route: "iv" }],
      riskLevel: "high" },
  ],
  "ward-09": [ // Pediatrics
    { name: "Acute Bronchiolitis", icdCode: "J21.9", description: "RSV bronchiolitis in 8-month-old with respiratory distress", severity: "moderate",
      vitalDeviations: { bpSys: [80,95], bpDia: [45,60], hr: [140,170], spo2: [88,94], temp: [37.5,38.5], rr: [40,60] },
      prescriptions: [{ med: "Oxygen Therapy", dose: "2L/min", freq: "Continuous", route: "inhalation" },{ med: "Normal Saline Drops", dose: "2 drops", freq: "PRN", route: "inhalation" }],
      riskLevel: "medium" },
    { name: "Kawasaki Disease", icdCode: "M30.3", description: "Acute Kawasaki with coronary artery involvement", severity: "severe",
      vitalDeviations: { bpSys: [85,100], bpDia: [50,65], hr: [130,160], spo2: [94,97], temp: [39,40.5], rr: [28,38] },
      prescriptions: [{ med: "IVIG", dose: "2g/kg", freq: "Single infusion over 12h", route: "iv" },{ med: "Aspirin", dose: "80mg/kg/day", freq: "QID", route: "oral" }],
      riskLevel: "high" },
    { name: "Juvenile Rheumatoid Arthritis", icdCode: "M08.00", description: "Systemic JRA with polyarticular involvement", severity: "moderate",
      vitalDeviations: { bpSys: [90,105], bpDia: [55,65], hr: [90,110], spo2: [96,99], temp: [37.5,39], rr: [20,28] },
      prescriptions: [{ med: "Ibuprofen", dose: "10mg/kg", freq: "TID", route: "oral" },{ med: "Methotrexate", dose: "10mg/m²", freq: "Weekly", route: "oral" }],
      riskLevel: "low" },
  ],
  "ward-10": [ // OB/GYN
    { name: "Severe Preeclampsia", icdCode: "O14.10", description: "Preeclampsia at 34 weeks with proteinuria and headache", severity: "severe",
      vitalDeviations: { bpSys: [160,190], bpDia: [100,120], hr: [85,105], spo2: [94,97], temp: [36.8,37.5], rr: [18,24] },
      prescriptions: [{ med: "Magnesium Sulfate", dose: "4g loading then 1g/hr", freq: "Continuous", route: "iv" },{ med: "Labetalol", dose: "200mg", freq: "Q12H", route: "oral" },{ med: "Betamethasone", dose: "12mg", freq: "Q24H x2 doses", route: "im" }],
      riskLevel: "high", deteriorating: true },
    { name: "Ectopic Pregnancy", icdCode: "O00.109", description: "Right tubal ectopic, pre-operative", severity: "severe",
      vitalDeviations: { bpSys: [90,110], bpDia: [55,70], hr: [95,115], spo2: [95,98], temp: [36.5,37.5], rr: [16,22] },
      prescriptions: [{ med: "Normal Saline", dose: "500ml", freq: "STAT", route: "iv" },{ med: "Methotrexate", dose: "50mg/m²", freq: "Single dose", route: "im" }],
      riskLevel: "high" },
    { name: "Polycystic Ovary Syndrome", icdCode: "E28.2", description: "PCOS with irregular menses and insulin resistance", severity: "mild",
      vitalDeviations: { bpSys: [115,130], bpDia: [70,85], hr: [72,88], spo2: [97,99], temp: [36.5,37.2], rr: [14,18] },
      prescriptions: [{ med: "Metformin", dose: "500mg", freq: "BID", route: "oral" },{ med: "OCP (Ethinyl Estradiol/Drospirenone)", dose: "1 tab", freq: "Daily", route: "oral" }],
      riskLevel: "low" },
  ],
  "ward-11": [ // General Surgery
    { name: "Acute Appendicitis - Post-Op", icdCode: "K35.80", description: "Post laparoscopic appendectomy day 1", severity: "mild",
      vitalDeviations: { bpSys: [110,130], bpDia: [65,80], hr: [75,95], spo2: [96,99], temp: [37,37.8], rr: [14,20] },
      prescriptions: [{ med: "Paracetamol", dose: "1g", freq: "QID", route: "iv" },{ med: "Metronidazole", dose: "500mg", freq: "TID", route: "iv" },{ med: "Ondansetron", dose: "4mg", freq: "Q8H PRN", route: "iv" }],
      riskLevel: "low" },
    { name: "Cholecystectomy - Post-Op", icdCode: "K80.20", description: "Post laparoscopic cholecystectomy for cholelithiasis", severity: "mild",
      vitalDeviations: { bpSys: [115,135], bpDia: [70,85], hr: [72,90], spo2: [96,99], temp: [36.8,37.5], rr: [14,18] },
      prescriptions: [{ med: "Tramadol", dose: "50mg", freq: "Q6H PRN", route: "oral" },{ med: "Pantoprazole", dose: "40mg", freq: "Daily", route: "oral" }],
      riskLevel: "low" },
    { name: "Incisional Hernia with Obstruction", icdCode: "K43.0", description: "Large incisional hernia with partial bowel obstruction", severity: "severe",
      vitalDeviations: { bpSys: [100,120], bpDia: [60,75], hr: [95,115], spo2: [94,97], temp: [37.5,38.5], rr: [20,26] },
      prescriptions: [{ med: "NG Tube - NPO", dose: "N/A", freq: "Continuous drainage", route: "oral" },{ med: "Normal Saline", dose: "125ml/hr", freq: "Continuous", route: "iv" },{ med: "Piperacillin-Tazobactam", dose: "4.5g", freq: "Q8H", route: "iv" }],
      riskLevel: "high" },
  ],
  "ward-12": [ // Psychiatry
    { name: "Major Depressive Disorder - Severe", icdCode: "F32.2", description: "Severe MDD with suicidal ideation, admitted for safety", severity: "severe",
      vitalDeviations: { bpSys: [105,125], bpDia: [65,80], hr: [65,85], spo2: [97,99], temp: [36.5,37.2], rr: [14,18] },
      prescriptions: [{ med: "Escitalopram", dose: "20mg", freq: "Once daily", route: "oral" },{ med: "Quetiapine", dose: "25mg", freq: "At bedtime", route: "oral" }],
      riskLevel: "medium" },
    { name: "Schizophrenia - Acute Psychosis", icdCode: "F20.9", description: "Acute psychotic episode with auditory hallucinations", severity: "severe",
      vitalDeviations: { bpSys: [120,140], bpDia: [75,90], hr: [90,110], spo2: [97,99], temp: [36.8,37.5], rr: [16,22] },
      prescriptions: [{ med: "Risperidone", dose: "2mg", freq: "BID", route: "oral" },{ med: "Lorazepam", dose: "2mg", freq: "Q8H PRN", route: "im" }],
      riskLevel: "medium" },
  ],
  "ward-13": [ // Dermatology
    { name: "Stevens-Johnson Syndrome", icdCode: "L51.1", description: "SJS involving 15% BSA, drug-induced", severity: "severe",
      vitalDeviations: { bpSys: [95,115], bpDia: [55,70], hr: [100,120], spo2: [93,96], temp: [38.5,40], rr: [20,26] },
      prescriptions: [{ med: "Cyclosporine", dose: "3mg/kg/day", freq: "BID", route: "oral" },{ med: "Silver Sulfadiazine Cream", dose: "Apply", freq: "BID", route: "topical" },{ med: "Morphine", dose: "4mg", freq: "Q4H PRN", route: "iv" }],
      riskLevel: "high", deteriorating: true },
    { name: "Severe Psoriasis", icdCode: "L40.0", description: "Erythrodermic psoriasis with >80% BSA involvement", severity: "moderate",
      vitalDeviations: { bpSys: [110,130], bpDia: [65,80], hr: [80,100], spo2: [95,98], temp: [37,38], rr: [16,22] },
      prescriptions: [{ med: "Methotrexate", dose: "15mg", freq: "Weekly", route: "oral" },{ med: "Folic Acid", dose: "5mg", freq: "Daily", route: "oral" },{ med: "Emollient Cream", dose: "Apply liberally", freq: "QID", route: "topical" }],
      riskLevel: "medium" },
  ],
  "ward-14": [ // Emergency
    { name: "Polytrauma - RTA", icdCode: "T07", description: "Multiple injuries from road traffic accident, GCS 12", severity: "severe",
      vitalDeviations: { bpSys: [80,100], bpDia: [45,60], hr: [110,140], spo2: [86,93], temp: [35.5,36.8], rr: [24,34] },
      prescriptions: [{ med: "Packed RBCs", dose: "4 units", freq: "STAT", route: "iv" },{ med: "Tranexamic Acid", dose: "1g", freq: "STAT then 1g over 8h", route: "iv" },{ med: "Ketamine", dose: "1mg/kg", freq: "For RSI", route: "iv" }],
      riskLevel: "critical", deteriorating: true },
    { name: "Acute Poisoning - Organophosphate", icdCode: "T60.0X1A", description: "OP poisoning with cholinergic crisis", severity: "severe",
      vitalDeviations: { bpSys: [90,110], bpDia: [50,65], hr: [45,65], spo2: [82,90], temp: [36,37], rr: [26,36] },
      prescriptions: [{ med: "Atropine", dose: "2mg", freq: "Q5-10min until atropinization", route: "iv" },{ med: "Pralidoxime", dose: "1g", freq: "Over 30 min, then Q8H", route: "iv" }],
      riskLevel: "critical" },
    { name: "Thermal Burns 30% TBSA", icdCode: "T31.30", description: "Second and third-degree burns, 30% body surface area", severity: "severe",
      vitalDeviations: { bpSys: [85,105], bpDia: [50,65], hr: [110,135], spo2: [90,95], temp: [36,37.5], rr: [22,30] },
      prescriptions: [{ med: "Ringer's Lactate", dose: "Parkland formula", freq: "First 24h", route: "iv" },{ med: "Morphine", dose: "0.1mg/kg", freq: "Q4H", route: "iv" },{ med: "Silver Sulfadiazine", dose: "Apply", freq: "BID", route: "topical" }],
      riskLevel: "critical", deteriorating: true },
    { name: "Acute Coronary Syndrome in ER", icdCode: "I24.9", description: "Chest pain with dynamic ECG changes, troponin pending", severity: "severe",
      vitalDeviations: { bpSys: [95,120], bpDia: [55,75], hr: [90,120], spo2: [91,96], temp: [36.5,37.5], rr: [18,24] },
      prescriptions: [{ med: "Aspirin", dose: "325mg", freq: "STAT", route: "oral" },{ med: "Nitroglycerin", dose: "0.4mg", freq: "SL Q5min x3", route: "oral" },{ med: "Heparin", dose: "60 U/kg bolus", freq: "Then 12 U/kg/hr", route: "iv" }],
      riskLevel: "high" },
  ],
  "ward-15": [ // ICU
    { name: "Septic Shock", icdCode: "R65.21", description: "Sepsis with multiorgan dysfunction, source: UTI", severity: "severe",
      vitalDeviations: { bpSys: [70,90], bpDia: [35,50], hr: [120,145], spo2: [84,92], temp: [39,41], rr: [28,38] },
      prescriptions: [{ med: "Norepinephrine", dose: "0.1mcg/kg/min", freq: "Titrate to MAP>65", route: "iv" },{ med: "Meropenem", dose: "1g", freq: "Q8H", route: "iv" },{ med: "Vancomycin", dose: "1g", freq: "Q12H", route: "iv" },{ med: "Hydrocortisone", dose: "50mg", freq: "Q6H", route: "iv" }],
      riskLevel: "critical", deteriorating: true },
    { name: "ARDS - Acute Respiratory Distress Syndrome", icdCode: "J80", description: "Severe ARDS on mechanical ventilation, P/F ratio 80", severity: "severe",
      vitalDeviations: { bpSys: [85,105], bpDia: [50,65], hr: [100,125], spo2: [82,90], temp: [38,39.5], rr: [30,40] },
      prescriptions: [{ med: "Fentanyl", dose: "50mcg/hr", freq: "Continuous infusion", route: "iv" },{ med: "Cisatracurium", dose: "1-3mcg/kg/min", freq: "Continuous for 48h", route: "iv" },{ med: "Piperacillin-Tazobactam", dose: "4.5g", freq: "Q6H", route: "iv" }],
      riskLevel: "critical", deteriorating: true },
    { name: "Post-Cardiac Arrest", icdCode: "I46.9", description: "ROSC after VF arrest, targeted temperature management", severity: "severe",
      vitalDeviations: { bpSys: [80,100], bpDia: [45,60], hr: [70,95], spo2: [90,95], temp: [33,34], rr: [12,18] },
      prescriptions: [{ med: "Epinephrine Infusion", dose: "0.05mcg/kg/min", freq: "Titrate", route: "iv" },{ med: "Midazolam", dose: "2mg/hr", freq: "Continuous", route: "iv" },{ med: "Amiodarone", dose: "150mg", freq: "STAT then 1mg/min x6h", route: "iv" }],
      riskLevel: "critical" },
    { name: "Multi-Organ Failure", icdCode: "R65.20", description: "Progressive multi-organ dysfunction post-surgery", severity: "severe",
      vitalDeviations: { bpSys: [70,90], bpDia: [35,50], hr: [110,140], spo2: [80,88], temp: [38.5,40], rr: [28,38] },
      prescriptions: [{ med: "Dopamine", dose: "5mcg/kg/min", freq: "Titrate to effect", route: "iv" },{ med: "Imipenem", dose: "500mg", freq: "Q6H", route: "iv" },{ med: "Albumin 20%", dose: "100ml", freq: "Q12H", route: "iv" }],
      riskLevel: "critical", deteriorating: true },
  ],
};

// Patient count targets per ward
const WARD_PATIENT_COUNTS: Record<string, number> = {
  "ward-01": 18, "ward-02": 14, "ward-03": 14, "ward-04": 16,
  "ward-05": 12, "ward-06": 12, "ward-07": 10, "ward-08": 10,
  "ward-09": 12, "ward-10": 12, "ward-11": 14, "ward-12": 8,
  "ward-13": 8,  "ward-14": 14, "ward-15": 16,
};

// ─── Generate All Data ────────────────────────────────────────────────────────

let patientCounter = 0;
let diagCounter = 0;
let vitalCounter = 0;
let prescCounter = 0;
let noteCounter = 0;
let riskCounter = 0;
let alertCounter = 0;

function generateName(gender: Gender): string {
  const first = gender === "male" ? pick(MALE_FIRST) : pick(FEMALE_FIRST);
  const last = pick(LAST_NAMES);
  return `${first} ${last}`;
}

function generatePhone(): string {
  return `+91 ${randInt(70000,99999)}${randInt(10000,99999)}`;
}

function generateAddress(): string {
  const areas = [
    "Koramangala","Indiranagar","Bandra West","Andheri East","Connaught Place",
    "MG Road","Jubilee Hills","Anna Nagar","Salt Lake","Aundh",
    "Sector 15","Civil Lines","Rajouri Garden","HSR Layout","Whitefield",
  ];
  const cities = ["Bangalore","Mumbai","Delhi","Hyderabad","Chennai","Pune","Kolkata","Jaipur"];
  return `${randInt(1,999)}, ${pick(areas)}, ${pick(cities)}`;
}

// Clinical note templates per disease severity
const NOTE_TEMPLATES_DOCTOR: Record<string, string[]> = {
  severe: [
    "Patient condition remains critical. Monitoring closely for signs of deterioration. Current treatment plan being escalated.",
    "Reviewed latest labs and imaging. Findings consistent with worsening condition. Discussed prognosis with family.",
    "Multi-disciplinary team consulted. Adjusting medications based on latest response. ICU transfer being considered.",
    "Patient showing some response to treatment but remains unstable. Continue current regimen with close monitoring.",
    "Urgent reassessment done. New complications noted. Modified treatment protocol accordingly.",
  ],
  moderate: [
    "Patient stable with mild improvement. Continue current medications and monitor vitals Q4H.",
    "Reviewed daily progress. Treatment response satisfactory. May consider step-down in 48-72 hours.",
    "Symptoms improving gradually. Labs trending towards normal. Continue supportive care.",
    "Patient tolerating medications well. No new complaints. Plan for repeat investigations in 48h.",
  ],
  mild: [
    "Recovery progressing well. Patient ambulatory and tolerating oral feeds. Plan for discharge assessment.",
    "Post-operative recovery uneventful. Wound healing well. Pain well controlled.",
    "Patient stable, good improvement noted. Preparing for discharge planning.",
  ],
};

const NOTE_TEMPLATES_NURSE: string[] = [
  "Vitals recorded. Patient comfortable, no acute distress. IV site clean, no signs of phlebitis.",
  "Administered medications as prescribed. Patient tolerated well. Intake/output charted.",
  "Patient assisted with personal hygiene. Repositioned to prevent pressure sores. Fall precautions in place.",
  "Shift handover: Patient stable. All medications given on time. No new complaints during shift.",
  "Wound dressing changed. Site clean with no signs of infection. Patient reported mild discomfort.",
  "Patient mobilized with assistance. Tolerated well, no dizziness or shortness of breath noted.",
  "Oxygen therapy adjusted per doctor's orders. SpO2 maintaining above target. Patient resting comfortably.",
  "Night assessment: Patient sleeping intermittently. Vitals stable. IV running at prescribed rate.",
];

// ─── Main Generation Function ─────────────────────────────────────────────────

function generateAll() {
  const patients: Patient[] = [];
  const diagnoses: Diagnosis[] = [];
  const vitals: Vital[] = [];
  const prescriptions: Prescription[] = [];
  const clinicalNotes: ClinicalNote[] = [];
  const riskScores: RiskScore[] = [];
  const alerts: Alert[] = [];

  for (const ward of WARDS) {
    const diseases = DISEASE_MAP[ward.id] || [];
    if (!diseases.length) continue;
    const count = WARD_PATIENT_COUNTS[ward.id] || 10;
    const doctorForWard = DOCTOR_NAMES[WARDS.indexOf(ward) % DOCTOR_NAMES.length];

    for (let p = 0; p < count; p++) {
      patientCounter++;
      const gender: Gender = rand() > 0.48 ? "male" : "female";
      const disease = diseases[p % diseases.length]; // Cycle through diseases
      const isDeteriorating = disease.deteriorating && rand() > 0.4;

      // Age ranges (pediatrics gets young ages, OB/GYN gets female of appropriate age)
      let ageMin = 25, ageMax = 75;
      if (ward.id === "ward-09") { ageMin = 1; ageMax = 15; }
      else if (ward.id === "ward-10") { ageMin = 18; ageMax = 42; }
      else if (ward.id === "ward-12") { ageMin = 18; ageMax = 65; }
      const age = randInt(ageMin, ageMax);

      const admDaysAgo = randInt(1, 28);
      const isDischargedChance = admDaysAgo > 14 ? 0.4 : (admDaysAgo > 7 ? 0.2 : 0.05);
      const isDischarged = !isDeteriorating && rand() < isDischargedChance && disease.severity !== "severe";
      const isICU = ward.id === "ward-15" || (disease.riskLevel === "critical" && rand() > 0.5);

      const status: PatientStatus = isDischarged
        ? "discharged"
        : isICU
          ? "icu"
          : disease.riskLevel === "high" || disease.riskLevel === "critical"
            ? "under_observation"
            : "admitted";

      const roomNum = `${ward.id.replace("ward-","")}-${String(randInt(1,ward.totalBeds)).padStart(2,"0")}`;

      const patient: Patient = {
        id: `pat-${String(patientCounter).padStart(5,"0")}`,
        mrn: `MRN-2026-${String(patientCounter).padStart(5,"0")}`,
        fullName: generateName(ward.id === "ward-10" ? "female" : gender),
        age,
        dob: (() => { const d = new Date(NOW); d.setFullYear(d.getFullYear() - age); d.setMonth(randInt(0,11)); d.setDate(randInt(1,28)); return d.toISOString().split("T")[0]; })(),
        gender: ward.id === "ward-10" ? "female" : gender,
        bloodGroup: pick(BLOOD_GROUPS),
        contactNumber: generatePhone(),
        emergencyContact: generatePhone(),
        address: generateAddress(),
        admissionDate: daysAgo(admDaysAgo, randInt(0,12)),
        dischargeDate: isDischarged ? daysAgo(randInt(0, admDaysAgo - 1)) : null,
        status,
        wardId: ward.id,
        wardName: ward.name,
        roomNumber: roomNum,
        assignedDoctorId: `doc-${(WARDS.indexOf(ward) % DOCTOR_NAMES.length) + 1}`,
        assignedDoctorName: doctorForWard,
        riskLevel: disease.riskLevel,
      };
      patients.push(patient);

      // Update ward occupancy
      if (!isDischarged) ward.occupiedBeds++;

      // --- Diagnoses (1-2 per patient) ---
      const numDiag = randInt(1, 2);
      const patDiseases = [disease, ...pickN(diseases.filter(d => d !== disease), numDiag - 1)];
      for (const dis of patDiseases) {
        diagCounter++;
        diagnoses.push({
          id: `diag-${String(diagCounter).padStart(5,"0")}`,
          patientId: patient.id,
          icdCode: dis.icdCode,
          name: dis.name,
          description: dis.description,
          severity: dis.severity,
          diagnosedDate: patient.admissionDate,
          status: isDischarged ? "resolved" : (dis.severity === "mild" ? "active" : rand() > 0.3 ? "active" : "chronic"),
        });
      }

      // --- Vitals (3-6 readings, deteriorating patients trend worse) ---
      const numVitals = randInt(3, 6);
      const vitalInterval = Math.floor((admDaysAgo * 24) / numVitals); // hours between readings
      for (let v = 0; v < numVitals; v++) {
        vitalCounter++;
        const hoursFromAdm = v * vitalInterval;
        const deteriorationFactor = isDeteriorating ? 1 + (v / numVitals) * 0.3 : 1;
        const improvementFactor = !isDeteriorating && disease.severity === "moderate" ? 1 - (v / numVitals) * 0.15 : 1;
        const dev = disease.vitalDeviations;

        const bpSys = Math.round((randInt(dev.bpSys?.[0] || 110, dev.bpSys?.[1] || 130)) * (isDeteriorating ? deteriorationFactor : improvementFactor));
        const bpDia = Math.round((randInt(dev.bpDia?.[0] || 65, dev.bpDia?.[1] || 85)) * (isDeteriorating ? deteriorationFactor : improvementFactor));
        const hr = Math.round((randInt(dev.hr?.[0] || 70, dev.hr?.[1] || 90)) * (isDeteriorating ? deteriorationFactor : 1));
        const spo2Val = randInt(dev.spo2?.[0] || 95, dev.spo2?.[1] || 99);
        const spo2 = isDeteriorating ? Math.max(75, spo2Val - Math.round(v * 2)) : Math.min(100, spo2Val + (improvementFactor < 1 ? Math.round(v * 0.5) : 0));
        const temp = parseFloat(((randInt((dev.temp?.[0] || 36.5) * 10, (dev.temp?.[1] || 37.5) * 10) / 10) * (isDeteriorating ? 1 + v * 0.01 : 1)).toFixed(1));
        const rr = Math.round((randInt(dev.rr?.[0] || 14, dev.rr?.[1] || 20)) * (isDeteriorating ? deteriorationFactor : improvementFactor));

        vitals.push({
          id: `vit-${String(vitalCounter).padStart(6,"0")}`,
          patientId: patient.id,
          bpSystolic: Math.min(250, Math.max(60, bpSys)),
          bpDiastolic: Math.min(150, Math.max(30, bpDia)),
          heartRate: Math.min(200, Math.max(30, hr)),
          spo2: Math.min(100, Math.max(60, spo2)),
          temperature: Math.min(42, Math.max(33, temp)),
          respiratoryRate: Math.min(50, Math.max(8, rr)),
          recordedAt: daysAgo(admDaysAgo, -hoursFromAdm),
          recordedBy: pick(NURSE_NAMES),
        });
      }

      // --- Prescriptions ---
      for (const dis of patDiseases) {
        for (const rx of dis.prescriptions) {
          prescCounter++;
          prescriptions.push({
            id: `rx-${String(prescCounter).padStart(5,"0")}`,
            patientId: patient.id,
            diagnosisId: diagnoses.find(d => d.patientId === patient.id && d.icdCode === dis.icdCode)?.id || "",
            medicationName: rx.med,
            dosage: rx.dose,
            frequency: rx.freq,
            route: rx.route,
            startDate: patient.admissionDate,
            endDate: isDischarged ? patient.dischargeDate : null,
            status: isDischarged ? "completed" : "active",
            prescribedBy: doctorForWard,
            notes: "",
          });
        }
      }

      // --- Clinical Notes (2-4 per patient) ---
      const numNotes = randInt(2, 4);
      for (let n = 0; n < numNotes; n++) {
        noteCounter++;
        const isDocNote = n === 0 || rand() > 0.5;
        const noteHoursAgo = Math.floor((admDaysAgo * 24 * (numNotes - n)) / (numNotes + 1));
        const templates = isDocNote
          ? NOTE_TEMPLATES_DOCTOR[disease.severity] || NOTE_TEMPLATES_DOCTOR.moderate
          : NOTE_TEMPLATES_NURSE;

        clinicalNotes.push({
          id: `note-${String(noteCounter).padStart(5,"0")}`,
          patientId: patient.id,
          authorName: isDocNote ? doctorForWard : pick(NURSE_NAMES),
          noteType: isDocNote ? "doctor" : "nurse",
          content: `[${patient.fullName} - ${disease.name}] ${pick(templates!)}`,
          createdAt: daysAgo(0, -noteHoursAgo),
        });
      }

      // --- Risk Score ---
      riskCounter++;
      const numericScore = disease.riskLevel === "critical" ? randInt(80, 98) :
                           disease.riskLevel === "high" ? randInt(60, 79) :
                           disease.riskLevel === "medium" ? randInt(35, 59) : randInt(5, 34);
      const factors: string[] = [];
      if (disease.vitalDeviations.spo2 && disease.vitalDeviations.spo2[0] < 92) factors.push("Low SpO2");
      if (disease.vitalDeviations.bpSys && disease.vitalDeviations.bpSys[0] < 90) factors.push("Hypotension");
      if (disease.vitalDeviations.bpSys && disease.vitalDeviations.bpSys[1] > 160) factors.push("Hypertension");
      if (disease.vitalDeviations.hr && disease.vitalDeviations.hr[1] > 120) factors.push("Tachycardia");
      if (disease.vitalDeviations.temp && disease.vitalDeviations.temp[1] > 38.5) factors.push("Fever");
      if (disease.vitalDeviations.rr && disease.vitalDeviations.rr[1] > 28) factors.push("Tachypnea");
      if (isDeteriorating) factors.push("Deteriorating trend");
      if (age > 65) factors.push("Advanced age");
      if (disease.severity === "severe") factors.push("Severe underlying condition");

      riskScores.push({
        id: `risk-${String(riskCounter).padStart(5,"0")}`,
        patientId: patient.id,
        score: isDeteriorating ? "critical" : disease.riskLevel,
        numericScore: isDeteriorating ? Math.min(99, numericScore + 15) : numericScore,
        explanation: generateRiskExplanation(patient, disease, isDeteriorating, factors),
        factors,
        calculatedAt: daysAgo(randInt(0, 2)),
      });

      // --- Alerts (for high/critical risk) ---
      if ((disease.riskLevel === "critical" || disease.riskLevel === "high" || isDeteriorating) && !isDischarged) {
        alertCounter++;
        alerts.push({
          id: `alert-${String(alertCounter).padStart(4,"0")}`,
          patientId: patient.id,
          patientName: patient.fullName,
          wardName: ward.name,
          roomNumber: roomNum,
          message: generateAlertMessage(patient, disease, isDeteriorating),
          severity: isDeteriorating ? "critical" : disease.riskLevel,
          acknowledged: rand() > 0.6,
          createdAt: daysAgo(randInt(0, 3), randInt(0, 12)),
        });
      }
    }
  }

  return { patients, diagnoses, vitals, prescriptions, clinicalNotes, riskScores, alerts };
}

function generateRiskExplanation(patient: Patient, disease: DiseaseTemplate, deteriorating: boolean, factors: string[]): string {
  const age = patient.age;
  const base = `Patient ${patient.fullName} (${age}y/${patient.gender[0].toUpperCase()}) admitted with ${disease.name}.`;
  if (deteriorating) {
    return `${base} Vitals showing deteriorating trend over last ${randInt(12,48)} hours. ${factors.slice(0,3).join(", ")} are primary concerns. Immediate clinical review recommended.`;
  }
  if (disease.riskLevel === "critical") {
    return `${base} Critical condition with ${factors.slice(0,3).join(", ")}. Requires intensive monitoring and potential escalation of care.`;
  }
  if (disease.riskLevel === "high") {
    return `${base} Elevated risk due to ${factors.slice(0,2).join(" and ")}. Close monitoring with Q2H vitals recommended.`;
  }
  if (disease.riskLevel === "medium") {
    return `${base} Moderate risk profile. ${factors.length > 0 ? factors[0] + " noted." : ""} Continue current monitoring frequency.`;
  }
  return `${base} Currently stable with low risk profile. Standard monitoring adequate.`;
}

function generateAlertMessage(patient: Patient, disease: DiseaseTemplate, deteriorating: boolean): string {
  if (deteriorating) {
    const msgs = [
      `CRITICAL: ${patient.fullName} (${patient.roomNumber}) - Vitals deteriorating rapidly. SpO2 and BP trending down.`,
      `URGENT: ${patient.fullName} (${patient.roomNumber}) - ${disease.name} worsening. Immediate assessment required.`,
      `WARNING: ${patient.fullName} (${patient.roomNumber}) - Significant decline in vitals over past 6 hours.`,
    ];
    return pick(msgs);
  }
  const msgs = [
    `HIGH RISK: ${patient.fullName} (${patient.roomNumber}) - ${disease.name}. Risk score elevated.`,
    `ALERT: ${patient.fullName} (${patient.roomNumber}) - Abnormal vitals detected. Review recommended.`,
    `MONITOR: ${patient.fullName} (${patient.roomNumber}) - Patient flagged for close observation.`,
  ];
  return pick(msgs);
}

// ─── Generate and Export ──────────────────────────────────────────────────────

const generated = generateAll();

export const PATIENTS = generated.patients;
export const DIAGNOSES = generated.diagnoses;
export const VITALS = generated.vitals;
export const PRESCRIPTIONS = generated.prescriptions;
export const CLINICAL_NOTES = generated.clinicalNotes;
export const RISK_SCORES = generated.riskScores;
export const ALERTS = generated.alerts;

// Quick stats
export const TOTAL_PATIENTS = PATIENTS.length;
export const ADMITTED_PATIENTS = PATIENTS.filter(p => p.status !== "discharged").length;
export const DISCHARGED_PATIENTS = PATIENTS.filter(p => p.status === "discharged").length;
export const ICU_PATIENTS = PATIENTS.filter(p => p.status === "icu").length;
export const HIGH_RISK_PATIENTS = PATIENTS.filter(p => p.riskLevel === "high" || p.riskLevel === "critical").length;
export const CRITICAL_PATIENTS = PATIENTS.filter(p => p.riskLevel === "critical").length;
export const UNACKNOWLEDGED_ALERTS = ALERTS.filter(a => !a.acknowledged).length;

console.log(`🏥 Seed data generated: ${TOTAL_PATIENTS} patients, ${VITALS.length} vitals, ${DIAGNOSES.length} diagnoses, ${PRESCRIPTIONS.length} prescriptions, ${CLINICAL_NOTES.length} notes, ${RISK_SCORES.length} risk scores, ${ALERTS.length} alerts`);
