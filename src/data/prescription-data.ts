// ─── Prescription Letter Data Generator ─────────────────────────────────────────
// Generates 30+ unique prescription letters deterministically for existing patients.
// ~60% of patients get 1-3 prescription letters, ~40% are "new" (no letters).

import type { PrescriptionLetter, PrescriptionLetterMedication } from "../lib/types";
import { WARDS, PATIENTS } from "./seed-data";

// ─── Seeded PRNG (separate seed from seed-data.ts) ─────────────────────────────
let _rxSeed = 9999;
function rxRand(): number {
  _rxSeed |= 0; _rxSeed = _rxSeed + 0x6D2B79F5 | 0;
  let t = Math.imul(_rxSeed ^ _rxSeed >>> 15, 1 | _rxSeed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
function rxRandInt(min: number, max: number) { return Math.floor(rxRand() * (max - min + 1)) + min; }
function rxPick<T>(arr: T[]): T { return arr[rxRandInt(0, arr.length - 1)]; }

// ─── Constants ────────────────────────────────────────────────────────────────

const HOSPITAL_NAME = "MediCore General Hospital & Research Centre";

const DOCTOR_REG_NOS: Record<string, string> = {
  "Dr. Anand Sharma": "MCI-KA-28451",
  "Dr. Priya Patel": "MCI-GJ-31287",
  "Dr. Rajesh Kumar": "MCI-DL-19654",
  "Dr. Meera Nair": "MCI-KL-22103",
  "Dr. Vikram Singh": "MCI-RJ-44521",
  "Dr. Kavya Reddy": "MCI-TG-37890",
  "Dr. Suresh Iyer": "MCI-TN-15632",
  "Dr. Anjali Gupta": "MCI-UP-41278",
  "Dr. Deepak Joshi": "MCI-MH-33456",
  "Dr. Sneha Mehta": "MCI-MH-28901",
  "Dr. Karthik Rao": "MCI-KA-35712",
  "Dr. Divya Menon": "MCI-KL-26834",
  "Dr. Rahul Verma": "MCI-DL-42190",
  "Dr. Lakshmi Pillai": "MCI-KL-18956",
  "Dr. Amit Chauhan": "MCI-HR-39421",
};

const DURATIONS = [
  "3 days", "5 days", "7 days", "10 days", "14 days",
  "21 days", "1 month", "2 months", "3 months", "Until follow-up",
  "As needed", "Ongoing", "6 weeks", "4 weeks",
];

const MED_INSTRUCTIONS = [
  "Take with food",
  "Take on empty stomach",
  "Take 30 minutes before meals",
  "Take at bedtime",
  "Avoid dairy products for 2 hours",
  "Do not crush or chew",
  "Dissolve in water before taking",
  "Apply thin layer to affected area",
  "Shake well before use",
  "Keep refrigerated",
  "Avoid sun exposure after application",
  "Take with plenty of water",
  "Monitor blood sugar levels",
  "Check blood pressure regularly",
  "Report any unusual bleeding",
  "Avoid alcohol consumption",
  "",
  "",
  "",
];

const SPECIAL_INSTRUCTIONS_POOL = [
  "Patient advised strict bed rest. Low-salt diet recommended. Monitor fluid intake and output. Report any worsening of symptoms immediately.",
  "Follow diabetic diet. Monitor blood glucose QID. Foot care education provided. Avoid skipping meals while on insulin.",
  "DVT prophylaxis in place. Encourage early mobilization as tolerated. TED stockings to be worn during waking hours.",
  "NPO until further notice. IV fluids running. NG tube in situ for drainage. Monitor abdominal girth Q8H.",
  "Seizure precautions maintained. Padded side rails up. Helmet at bedside. No driving for 6 months post last seizure.",
  "Wound care: Clean with normal saline, apply betadine, cover with sterile dressing BID. Watch for signs of infection.",
  "Strict I/O charting. Daily weight. Low protein diet for hepatic encephalopathy. Lactulose titrated to 3-4 stools/day.",
  "Cardiac monitoring continuous. Notify if HR < 50 or > 130. Keep crash cart accessible. ECG Q12H.",
  "Respiratory isolation precautions. N95 mask required. Sputum AFB x3 collected. Contact tracing initiated.",
  "Pain management: VAS scoring Q4H. Multimodal analgesia approach. Avoid NSAIDs due to renal function.",
  "Post-operative care: Incentive spirometry Q1H while awake. Ambulate TID. Progressive diet as tolerated.",
  "Chemotherapy protocol cycle 4/6. Anti-emetic prophylaxis given. Monitor for febrile neutropenia. CBC with diff daily.",
  "Psychiatric safety measures: 1:1 observation. Remove sharps from room. Document mood and behavior Q4H.",
  "Physiotherapy referral made. ROM exercises BID. Weight bearing as tolerated with walker.",
  "Allergies verified: Penicillin (rash), Sulfa (anaphylaxis). Allergy band in place. Chart flagged.",
  "Dialysis schedule: MWF sessions. Pre-dialysis weight and vitals. Monitor access site for complications.",
  "Patient counselled about smoking cessation. Nicotine patch applied. Referral to cessation program.",
  "Oxygen therapy: Maintain SpO2 > 92%. Wean O2 as tolerated. ABG after any FiO2 changes.",
  "Nutritional assessment done. BMI 16.2 — malnourished. High-calorie, high-protein diet. Dietician consulted.",
  "Maternal monitoring: CTG BID. Fetal kick count chart maintained. Report decreased fetal movements immediately.",
  "Blood transfusion completed — 2 units PRBC. Post-transfusion vitals stable. Watch for delayed reactions.",
  "Steroid taper schedule: Reduce by 5mg every 3 days. Monitor blood glucose. Watch for signs of adrenal insufficiency.",
  "Patient education on insulin self-administration completed. Demonstrated proper technique. Sharps disposal kit provided.",
  "Anticoagulation monitoring: INR target 2.0-3.0. Weekly INR checks. Report unusual bruising or bleeding.",
  "Nebulization schedule: Salbutamol Q4H, Ipratropium Q6H. Peak flow monitoring BID. Action plan provided.",
  "Central line care: Dressing change Q72H or if soiled. Daily assessment for signs of CLABSI. Documentation of insertion site.",
  "Liver function monitoring weekly while on Methotrexate. Avoid alcohol completely. Folic acid supplementation.",
  "Thyroid function tests to be repeated in 6 weeks. Patient counselled on medication compliance.",
  "Fall risk assessment: HIGH. Yellow wristband and socks. Bed in low position. Call bell within reach.",
  "Palliative care team consulted. Goals of care discussion with family scheduled. Comfort measures prioritized.",
];

// ─── Prescription Template Medications per Department ─────────────────────────

interface RxTemplate {
  diagnosis: string;
  medications: Omit<PrescriptionLetterMedication, "duration" | "instructions">[];
  specialInstructionsHint: number; // index into SPECIAL_INSTRUCTIONS_POOL
}

const RX_TEMPLATES: RxTemplate[] = [
  // Cardiology (0-3)
  { diagnosis: "Acute Myocardial Infarction (STEMI)",
    medications: [
      { name: "Aspirin", dosage: "81mg", frequency: "Once daily", route: "Oral" },
      { name: "Clopidogrel", dosage: "75mg", frequency: "Once daily", route: "Oral" },
      { name: "Atorvastatin", dosage: "80mg", frequency: "Once daily at bedtime", route: "Oral" },
      { name: "Metoprolol Tartrate", dosage: "25mg", frequency: "Twice daily", route: "Oral" },
      { name: "Ramipril", dosage: "2.5mg", frequency: "Once daily", route: "Oral" },
      { name: "Enoxaparin", dosage: "60mg", frequency: "Twice daily", route: "SC Injection" },
    ], specialInstructionsHint: 7 },
  { diagnosis: "Congestive Heart Failure (NYHA Class III)",
    medications: [
      { name: "Furosemide", dosage: "40mg", frequency: "Twice daily", route: "Oral" },
      { name: "Spironolactone", dosage: "25mg", frequency: "Once daily", route: "Oral" },
      { name: "Sacubitril/Valsartan", dosage: "49/51mg", frequency: "Twice daily", route: "Oral" },
      { name: "Carvedilol", dosage: "6.25mg", frequency: "Twice daily with food", route: "Oral" },
    ], specialInstructionsHint: 0 },
  { diagnosis: "Atrial Fibrillation with RVR",
    medications: [
      { name: "Amiodarone", dosage: "200mg", frequency: "Three times daily (loading)", route: "Oral" },
      { name: "Rivaroxaban", dosage: "20mg", frequency: "Once daily with dinner", route: "Oral" },
      { name: "Diltiazem CD", dosage: "180mg", frequency: "Once daily", route: "Oral" },
    ], specialInstructionsHint: 7 },
  { diagnosis: "Hypertensive Urgency",
    medications: [
      { name: "Amlodipine", dosage: "10mg", frequency: "Once daily", route: "Oral" },
      { name: "Telmisartan", dosage: "40mg", frequency: "Once daily", route: "Oral" },
      { name: "Hydrochlorothiazide", dosage: "12.5mg", frequency: "Once daily morning", route: "Oral" },
    ], specialInstructionsHint: 0 },

  // Neurology (4-6)
  { diagnosis: "Acute Ischemic Stroke — Post-tPA",
    medications: [
      { name: "Aspirin", dosage: "325mg", frequency: "Once daily (after 24h)", route: "Oral" },
      { name: "Atorvastatin", dosage: "40mg", frequency: "Once daily", route: "Oral" },
      { name: "Amlodipine", dosage: "5mg", frequency: "Once daily", route: "Oral" },
      { name: "Pantoprazole", dosage: "40mg", frequency: "Once daily before breakfast", route: "Oral" },
    ], specialInstructionsHint: 4 },
  { diagnosis: "Status Epilepticus — Post-Stabilization",
    medications: [
      { name: "Levetiracetam", dosage: "1000mg", frequency: "Twice daily", route: "IV/Oral" },
      { name: "Sodium Valproate", dosage: "500mg", frequency: "Twice daily", route: "Oral" },
      { name: "Clobazam", dosage: "10mg", frequency: "At bedtime", route: "Oral" },
    ], specialInstructionsHint: 4 },
  { diagnosis: "Bacterial Meningitis",
    medications: [
      { name: "Ceftriaxone", dosage: "2g", frequency: "Every 12 hours", route: "IV" },
      { name: "Vancomycin", dosage: "1g", frequency: "Every 12 hours", route: "IV" },
      { name: "Dexamethasone", dosage: "0.15mg/kg", frequency: "Every 6 hours", route: "IV" },
      { name: "Paracetamol", dosage: "1g", frequency: "Every 6 hours PRN", route: "IV" },
    ], specialInstructionsHint: 8 },

  // Pulmonology (7-9)
  { diagnosis: "COPD Acute Exacerbation",
    medications: [
      { name: "Salbutamol Nebulization", dosage: "5mg", frequency: "Every 4 hours", route: "Nebulization" },
      { name: "Ipratropium Bromide", dosage: "0.5mg", frequency: "Every 6 hours", route: "Nebulization" },
      { name: "Prednisolone", dosage: "40mg", frequency: "Once daily (5-day course)", route: "Oral" },
      { name: "Azithromycin", dosage: "500mg", frequency: "Once daily (3-day course)", route: "Oral" },
      { name: "Tiotropium", dosage: "18mcg", frequency: "Once daily (inhaler)", route: "Inhalation" },
    ], specialInstructionsHint: 17 },
  { diagnosis: "Community-Acquired Pneumonia (CURB-65: 3)",
    medications: [
      { name: "Ceftriaxone", dosage: "1g", frequency: "Once daily", route: "IV" },
      { name: "Azithromycin", dosage: "500mg", frequency: "Once daily", route: "Oral" },
      { name: "Paracetamol", dosage: "500mg", frequency: "Every 6 hours PRN", route: "Oral" },
    ], specialInstructionsHint: 17 },
  { diagnosis: "Pulmonary Tuberculosis (Category I)",
    medications: [
      { name: "Isoniazid (H)", dosage: "300mg", frequency: "Once daily (empty stomach)", route: "Oral" },
      { name: "Rifampicin (R)", dosage: "600mg", frequency: "Once daily (empty stomach)", route: "Oral" },
      { name: "Pyrazinamide (Z)", dosage: "1500mg", frequency: "Once daily", route: "Oral" },
      { name: "Ethambutol (E)", dosage: "1200mg", frequency: "Once daily", route: "Oral" },
      { name: "Pyridoxine (B6)", dosage: "40mg", frequency: "Once daily", route: "Oral" },
    ], specialInstructionsHint: 8 },

  // Gastroenterology (10-12)
  { diagnosis: "Acute Pancreatitis (Gallstone)",
    medications: [
      { name: "Normal Saline", dosage: "125ml/hr", frequency: "Continuous", route: "IV" },
      { name: "Pantoprazole", dosage: "40mg", frequency: "Twice daily", route: "IV" },
      { name: "Tramadol", dosage: "50mg", frequency: "Every 8 hours PRN", route: "IV" },
      { name: "Ondansetron", dosage: "4mg", frequency: "Every 8 hours PRN", route: "IV" },
    ], specialInstructionsHint: 3 },
  { diagnosis: "Upper GI Bleed — Peptic Ulcer",
    medications: [
      { name: "Pantoprazole", dosage: "8mg/hr", frequency: "Continuous infusion (72h)", route: "IV" },
      { name: "Sucralfate", dosage: "1g", frequency: "Four times daily before meals", route: "Oral" },
      { name: "Tranexamic Acid", dosage: "500mg", frequency: "Three times daily", route: "IV" },
    ], specialInstructionsHint: 3 },
  { diagnosis: "Decompensated Liver Cirrhosis",
    medications: [
      { name: "Spironolactone", dosage: "100mg", frequency: "Once daily morning", route: "Oral" },
      { name: "Furosemide", dosage: "40mg", frequency: "Once daily morning", route: "Oral" },
      { name: "Lactulose", dosage: "30ml", frequency: "Three times daily", route: "Oral" },
      { name: "Rifaximin", dosage: "550mg", frequency: "Twice daily", route: "Oral" },
      { name: "Propranolol", dosage: "20mg", frequency: "Twice daily", route: "Oral" },
    ], specialInstructionsHint: 6 },

  // Nephrology (13-14)
  { diagnosis: "Acute Kidney Injury Stage 3",
    medications: [
      { name: "Calcium Gluconate 10%", dosage: "10ml", frequency: "STAT (if K+ > 6.5)", route: "Slow IV" },
      { name: "Sodium Bicarbonate", dosage: "50mEq", frequency: "PRN for acidosis", route: "IV" },
      { name: "Furosemide", dosage: "80mg", frequency: "Twice daily", route: "IV" },
      { name: "Insulin Regular + D25", dosage: "10U/50ml", frequency: "PRN for hyperkalemia", route: "IV" },
    ], specialInstructionsHint: 15 },
  { diagnosis: "CKD Stage V on Hemodialysis",
    medications: [
      { name: "Erythropoietin", dosage: "4000 IU", frequency: "Three times weekly", route: "SC Injection" },
      { name: "Sevelamer", dosage: "800mg", frequency: "Three times daily with meals", route: "Oral" },
      { name: "Calcitriol", dosage: "0.25mcg", frequency: "Once daily", route: "Oral" },
      { name: "Iron Sucrose", dosage: "100mg", frequency: "Weekly (during dialysis)", route: "IV" },
      { name: "Amlodipine", dosage: "5mg", frequency: "Once daily", route: "Oral" },
    ], specialInstructionsHint: 15 },

  // Endocrinology (15-17)
  { diagnosis: "Diabetic Ketoacidosis (DKA)",
    medications: [
      { name: "Insulin Regular", dosage: "0.1 U/kg/hr", frequency: "Continuous infusion", route: "IV" },
      { name: "Normal Saline", dosage: "1L then 500ml/hr", frequency: "Titrate", route: "IV" },
      { name: "Potassium Chloride", dosage: "20mEq/L", frequency: "In each liter of fluids", route: "IV" },
    ], specialInstructionsHint: 1 },
  { diagnosis: "Thyroid Storm (Thyrotoxic Crisis)",
    medications: [
      { name: "Propylthiouracil", dosage: "200mg", frequency: "Every 4 hours", route: "Oral/NG" },
      { name: "Propranolol", dosage: "60mg", frequency: "Every 6 hours", route: "Oral" },
      { name: "Hydrocortisone", dosage: "100mg", frequency: "Every 8 hours", route: "IV" },
      { name: "Lugol's Iodine", dosage: "5 drops", frequency: "Every 8 hours (1h after PTU)", route: "Oral" },
    ], specialInstructionsHint: 27 },
  { diagnosis: "Type 2 Diabetes — Uncontrolled (HbA1c 11.2%)",
    medications: [
      { name: "Metformin XR", dosage: "1000mg", frequency: "Twice daily with meals", route: "Oral" },
      { name: "Glimepiride", dosage: "2mg", frequency: "Once daily before breakfast", route: "Oral" },
      { name: "Insulin Glargine", dosage: "16 units", frequency: "At bedtime", route: "SC Injection" },
      { name: "Empagliflozin", dosage: "10mg", frequency: "Once daily morning", route: "Oral" },
    ], specialInstructionsHint: 22 },

  // Oncology (18-19)
  { diagnosis: "Breast Cancer (Post-Chemotherapy Cycle 4)",
    medications: [
      { name: "Ondansetron", dosage: "8mg", frequency: "Every 8 hours (3 days)", route: "Oral" },
      { name: "Dexamethasone", dosage: "4mg", frequency: "Twice daily (3 days)", route: "Oral" },
      { name: "Filgrastim", dosage: "5mcg/kg", frequency: "Daily for 5 days", route: "SC Injection" },
      { name: "Pantoprazole", dosage: "40mg", frequency: "Once daily", route: "Oral" },
      { name: "Lorazepam", dosage: "0.5mg", frequency: "Every 8 hours PRN", route: "Oral" },
    ], specialInstructionsHint: 11 },
  { diagnosis: "Non-Small Cell Lung Cancer (Stage IIIB)",
    medications: [
      { name: "Pembrolizumab", dosage: "200mg", frequency: "Every 21 days", route: "IV Infusion" },
      { name: "Ondansetron", dosage: "8mg", frequency: "Every 8 hours (day of infusion)", route: "IV" },
      { name: "Codeine Phosphate", dosage: "30mg", frequency: "Every 6 hours PRN", route: "Oral" },
      { name: "Dexamethasone", dosage: "8mg", frequency: "Pre-infusion", route: "IV" },
    ], specialInstructionsHint: 11 },

  // Orthopedics (20-21)
  { diagnosis: "Femoral Neck Fracture — Pre-Op",
    medications: [
      { name: "Morphine", dosage: "4mg", frequency: "Every 4 hours PRN", route: "IV" },
      { name: "Enoxaparin", dosage: "40mg", frequency: "Once daily", route: "SC Injection" },
      { name: "Cefazolin", dosage: "2g", frequency: "Pre-operative dose", route: "IV" },
      { name: "Pantoprazole", dosage: "40mg", frequency: "Once daily", route: "IV" },
    ], specialInstructionsHint: 2 },
  { diagnosis: "Total Knee Replacement — Post-Op Day 2",
    medications: [
      { name: "Tramadol", dosage: "50mg", frequency: "Every 6 hours", route: "Oral" },
      { name: "Paracetamol", dosage: "1g", frequency: "Every 6 hours", route: "Oral" },
      { name: "Rivaroxaban", dosage: "10mg", frequency: "Once daily", route: "Oral" },
      { name: "Celecoxib", dosage: "200mg", frequency: "Twice daily", route: "Oral" },
    ], specialInstructionsHint: 13 },

  // Emergency / ICU (22-25)
  { diagnosis: "Septic Shock (Source: Urinary Tract)",
    medications: [
      { name: "Norepinephrine", dosage: "0.1mcg/kg/min", frequency: "Titrate to MAP > 65", route: "IV Infusion" },
      { name: "Meropenem", dosage: "1g", frequency: "Every 8 hours", route: "IV" },
      { name: "Vancomycin", dosage: "1g", frequency: "Every 12 hours", route: "IV" },
      { name: "Hydrocortisone", dosage: "50mg", frequency: "Every 6 hours", route: "IV" },
      { name: "Normal Saline", dosage: "30ml/kg", frequency: "Bolus then reassess", route: "IV" },
    ], specialInstructionsHint: 7 },
  { diagnosis: "Organophosphate Poisoning",
    medications: [
      { name: "Atropine", dosage: "2mg", frequency: "Every 5-10 min until atropinized", route: "IV" },
      { name: "Pralidoxime (PAM)", dosage: "1g", frequency: "Over 30 min, then every 8h", route: "IV" },
      { name: "Normal Saline", dosage: "500ml", frequency: "Bolus then 125ml/hr", route: "IV" },
    ], specialInstructionsHint: 9 },
  { diagnosis: "Thermal Burns 30% TBSA",
    medications: [
      { name: "Ringer's Lactate", dosage: "Parkland formula", frequency: "First 24 hours", route: "IV" },
      { name: "Morphine", dosage: "0.1mg/kg", frequency: "Every 4 hours PRN", route: "IV" },
      { name: "Silver Sulfadiazine 1%", dosage: "Apply thin layer", frequency: "Twice daily", route: "Topical" },
      { name: "Ceftriaxone", dosage: "1g", frequency: "Once daily", route: "IV" },
      { name: "Tetanus Toxoid", dosage: "0.5ml", frequency: "STAT (if not immunized)", route: "IM" },
    ], specialInstructionsHint: 5 },
  { diagnosis: "ARDS on Mechanical Ventilation",
    medications: [
      { name: "Fentanyl", dosage: "50mcg/hr", frequency: "Continuous infusion", route: "IV" },
      { name: "Midazolam", dosage: "2mg/hr", frequency: "Continuous infusion", route: "IV" },
      { name: "Piperacillin-Tazobactam", dosage: "4.5g", frequency: "Every 6 hours", route: "IV" },
      { name: "Pantoprazole", dosage: "40mg", frequency: "Once daily", route: "IV" },
      { name: "Enoxaparin", dosage: "40mg", frequency: "Once daily", route: "SC Injection" },
    ], specialInstructionsHint: 17 },

  // Psychiatry (26-27)
  { diagnosis: "Major Depressive Disorder — Severe Episode",
    medications: [
      { name: "Escitalopram", dosage: "20mg", frequency: "Once daily morning", route: "Oral" },
      { name: "Quetiapine", dosage: "25mg", frequency: "At bedtime", route: "Oral" },
      { name: "Clonazepam", dosage: "0.5mg", frequency: "Twice daily PRN", route: "Oral" },
    ], specialInstructionsHint: 12 },
  { diagnosis: "Acute Psychotic Episode (Schizophrenia)",
    medications: [
      { name: "Risperidone", dosage: "2mg", frequency: "Twice daily", route: "Oral" },
      { name: "Lorazepam", dosage: "2mg", frequency: "Every 8 hours PRN", route: "IM" },
      { name: "Trihexyphenidyl", dosage: "2mg", frequency: "Twice daily", route: "Oral" },
    ], specialInstructionsHint: 12 },

  // OB/GYN (28-29)
  { diagnosis: "Severe Preeclampsia at 34 Weeks",
    medications: [
      { name: "Magnesium Sulfate", dosage: "4g loading, then 1g/hr", frequency: "Continuous", route: "IV" },
      { name: "Labetalol", dosage: "200mg", frequency: "Every 12 hours", route: "Oral" },
      { name: "Betamethasone", dosage: "12mg", frequency: "Two doses 24h apart", route: "IM" },
      { name: "Nifedipine", dosage: "10mg", frequency: "Every 8 hours PRN", route: "Oral" },
    ], specialInstructionsHint: 19 },
  { diagnosis: "Gestational Diabetes Mellitus",
    medications: [
      { name: "Insulin Aspart", dosage: "4-6 units", frequency: "Before each meal", route: "SC Injection" },
      { name: "Insulin NPH", dosage: "10 units", frequency: "At bedtime", route: "SC Injection" },
      { name: "Folic Acid", dosage: "5mg", frequency: "Once daily", route: "Oral" },
      { name: "Calcium + Vitamin D3", dosage: "500mg/250IU", frequency: "Once daily", route: "Oral" },
    ], specialInstructionsHint: 22 },

  // Dermatology (30-31)
  { diagnosis: "Stevens-Johnson Syndrome (Drug-Induced)",
    medications: [
      { name: "Cyclosporine", dosage: "3mg/kg/day", frequency: "Divided twice daily", route: "Oral" },
      { name: "Morphine", dosage: "4mg", frequency: "Every 4 hours PRN", route: "IV" },
      { name: "Silver Sulfadiazine", dosage: "Apply to lesions", frequency: "Twice daily", route: "Topical" },
      { name: "Chlorhexidine Mouthwash", dosage: "10ml", frequency: "Four times daily", route: "Oral rinse" },
    ], specialInstructionsHint: 5 },
  { diagnosis: "Severe Psoriasis (Erythrodermic)",
    medications: [
      { name: "Methotrexate", dosage: "15mg", frequency: "Once weekly", route: "Oral" },
      { name: "Folic Acid", dosage: "5mg", frequency: "Daily (except MTX day)", route: "Oral" },
      { name: "Clobetasol Propionate 0.05%", dosage: "Apply thin layer", frequency: "Twice daily", route: "Topical" },
      { name: "Emollient (White Soft Paraffin)", dosage: "Apply liberally", frequency: "Four times daily", route: "Topical" },
    ], specialInstructionsHint: 26 },

  // Pediatrics (32-33)
  { diagnosis: "Acute Bronchiolitis (RSV)",
    medications: [
      { name: "Oxygen Therapy", dosage: "1-2 L/min", frequency: "Continuous (maintain SpO2 > 92%)", route: "Nasal Prongs" },
      { name: "Normal Saline Drops", dosage: "2 drops/nostril", frequency: "Before feeds PRN", route: "Nasal" },
      { name: "Paracetamol Syrup", dosage: "15mg/kg", frequency: "Every 6 hours PRN", route: "Oral" },
    ], specialInstructionsHint: 17 },
  { diagnosis: "Kawasaki Disease with Coronary Involvement",
    medications: [
      { name: "IVIG", dosage: "2g/kg", frequency: "Single infusion over 12 hours", route: "IV" },
      { name: "Aspirin", dosage: "80mg/kg/day", frequency: "Divided QID (acute phase)", route: "Oral" },
      { name: "Paracetamol", dosage: "15mg/kg", frequency: "Every 6 hours PRN", route: "Oral" },
    ], specialInstructionsHint: 7 },
];

const NOW = new Date("2026-07-28T09:00:00+05:30");
function daysAgoRx(d: number, hourOffset = 0): string {
  const dt = new Date(NOW);
  dt.setDate(dt.getDate() - d);
  dt.setHours(dt.getHours() + hourOffset);
  return dt.toISOString();
}

// ─── Import patients list from seed data and generate letters ─────────────────



// Determine which patient IDs get letters (60% have letters, 40% "new")
const PATIENT_HAS_LETTERS: Set<string> = new Set();
const shuffledPatientIds = [...PATIENTS].map(p => p.id).sort(() => {
  _rxSeed = 12345; // Reset for deterministic shuffle
  return rxRand() - 0.5;
});

// Use a separate deterministic approach: patients with even-ish index get letters
for (let i = 0; i < PATIENTS.length; i++) {
  // ~60% of patients get letters
  _rxSeed = i * 7919 + 31337; // Unique seed per patient
  if (rxRand() > 0.4) {
    PATIENT_HAS_LETTERS.add(PATIENTS[i].id);
  }
}

// ─── Generate All Prescription Letters ────────────────────────────────────────

let letterCounter = 0;

export function generatePrescriptionLetters(): PrescriptionLetter[] {
  const letters: PrescriptionLetter[] = [];

  for (const patient of PATIENTS) {
    if (!PATIENT_HAS_LETTERS.has(patient.id)) continue;
    if (patient.status === "discharged") continue;

    // Each patient with letters gets 1-3 letters
    _rxSeed = parseInt(patient.id.replace("pat-", ""), 10) * 3571 + 42;
    const numLetters = rxRandInt(1, 3);

    for (let l = 0; l < numLetters; l++) {
      letterCounter++;
      const template = RX_TEMPLATES[(letterCounter - 1) % RX_TEMPLATES.length];
      const daysBack = rxRandInt(1, 21);

      const medications: PrescriptionLetterMedication[] = template.medications.map(med => ({
        ...med,
        duration: rxPick(DURATIONS),
        instructions: rxPick(MED_INSTRUCTIONS),
      }));

      const doctorName = patient.assignedDoctorName;
      const doctorRegNo = DOCTOR_REG_NOS[doctorName] || `MCI-XX-${rxRandInt(10000, 99999)}`;

      // Find the ward for this patient to get department
      const ward = WARDS.find(w => w.id === patient.wardId);
      const department = ward?.department || "General Medicine";

      const followUpDays = rxRandInt(7, 30);

      letters.push({
        id: `rxletter-${String(letterCounter).padStart(5, "0")}`,
        patientId: patient.id,
        patientName: patient.fullName,
        patientAge: patient.age,
        patientGender: patient.gender,
        patientMRN: patient.mrn,
        patientRoom: patient.roomNumber,
        dateIssued: daysAgoRx(daysBack, rxRandInt(0, 8)),
        doctorName,
        doctorRegNo,
        department,
        hospitalName: HOSPITAL_NAME,
        medications,
        diagnosis: template.diagnosis,
        specialInstructions: SPECIAL_INSTRUCTIONS_POOL[template.specialInstructionsHint % SPECIAL_INSTRUCTIONS_POOL.length],
        followUpDate: rxRand() > 0.3 ? daysAgoRx(-followUpDays) : null,
        isRefill: l > 0 && rxRand() > 0.5,
      });
    }
  }

  return letters;
}

// Generate once and export
export const PRESCRIPTION_LETTERS = generatePrescriptionLetters();

// Quick lookup
export function getLettersForPatient(patientId: string): PrescriptionLetter[] {
  return PRESCRIPTION_LETTERS.filter(l => l.patientId === patientId)
    .sort((a, b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime());
}

export function hasPatientLetters(patientId: string): boolean {
  return PATIENT_HAS_LETTERS.has(patientId);
}
