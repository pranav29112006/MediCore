import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, Activity, BrainCircuit, ChevronRight, Search,
  AlertTriangle, Heart, Thermometer, Wind, TrendingUp,
  TrendingDown, Clock, FileText, ArrowLeft, Pill,
  Stethoscope, ClipboardList, ScrollText,
} from "lucide-react";
import {
  getPatients, getAlerts, getRiskDistribution, getPatientById,
  getVitals, getDiagnoses, getPrescriptions, getClinicalNotes,
  getRiskScore, getLatestVitals, acknowledgeAlert,
  getPrescriptionLetters,
} from "../../lib/data-service";
import type { Patient, Alert, Vital, Diagnosis, Prescription, ClinicalNote, RiskScore } from "../../lib/types";
import { PrescriptionLetterCard, NoPrescriptionsState } from "./PrescriptionLetterCard";
import { AIPanel, AIPanelButton } from "./AIPanel";
import type { PatientContext } from "../../lib/gemini-service";

const RISK_COLORS: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-rose-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
};
const RISK_TEXT: Record<string, string> = {
  critical: "text-red-600 dark:text-red-400",
  high: "text-rose-600 dark:text-rose-400",
  medium: "text-amber-600 dark:text-amber-400",
  low: "text-emerald-600 dark:text-emerald-400",
};
const RISK_BG: Record<string, string> = {
  critical: "bg-red-500/10 border-red-500/30",
  high: "bg-rose-500/10 border-rose-500/30",
  medium: "bg-amber-500/10 border-amber-500/30",
  low: "bg-emerald-500/10 border-emerald-500/30",
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Patient Detail View ──────────────────────────────────────────────────────

function PatientDetailView({ patientId, onBack }: { patientId: string; onBack: () => void }) {
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  const patient = getPatientById(patientId);
  if (!patient) return <p className="text-muted-foreground">Patient not found.</p>;

  const vitals = getVitals(patientId);
  const diagnoses = getDiagnoses(patientId);
  const prescriptions = getPrescriptions(patientId);
  const notes = getClinicalNotes(patientId);
  const risk = getRiskScore(patientId);
  const prescriptionLetters = getPrescriptionLetters(patientId);
  const latestVital = vitals[vitals.length - 1];

  const patientContext: PatientContext = {
    patient,
    vitals,
    diagnoses,
    prescriptions,
    notes,
    riskScore: risk,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{patient.fullName}</h2>
          <p className="text-sm text-muted-foreground">{patient.mrn} · {patient.age}y/{patient.gender[0].toUpperCase()} · {patient.bloodGroup} · Room {patient.roomNumber}</p>
        </div>
        <div className={`px-3 py-1.5 rounded-full border text-xs font-bold uppercase ${RISK_BG[patient.riskLevel]} ${RISK_TEXT[patient.riskLevel]}`}>
          {patient.riskLevel} Risk
        </div>
      </div>

      {/* Risk Score Banner */}
      {risk && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border ${RISK_BG[risk.score]}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-bold ${RISK_TEXT[risk.score]}`}>AI Risk Assessment — Score: {risk.numericScore}/100</span>
            <span className="text-xs text-muted-foreground">{timeAgo(risk.calculatedAt)}</span>
          </div>
          <p className="text-sm text-foreground/80">{risk.explanation}</p>
          {risk.factors.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {risk.factors.map((f, i) => (
                <span key={i} className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-background/60 text-foreground/70">{f}</span>
              ))}
            </div>
          )}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Vitals + Diagnoses */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Latest Vitals */}
          {latestVital && (
            <div className="p-5 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Activity className="size-5 text-primary" /> Latest Vitals
                <span className="text-xs text-muted-foreground ml-auto">{timeAgo(latestVital.recordedAt)}</span>
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {[
                  { label: "BP", value: `${latestVital.bpSystolic}/${latestVital.bpDiastolic}`, unit: "mmHg", icon: Heart, danger: latestVital.bpSystolic > 160 || latestVital.bpSystolic < 90 },
                  { label: "HR", value: latestVital.heartRate, unit: "bpm", icon: Activity, danger: latestVital.heartRate > 120 || latestVital.heartRate < 50 },
                  { label: "SpO2", value: latestVital.spo2, unit: "%", icon: Wind, danger: latestVital.spo2 < 92 },
                  { label: "Temp", value: latestVital.temperature, unit: "°C", icon: Thermometer, danger: latestVital.temperature > 38.5 },
                  { label: "RR", value: latestVital.respiratoryRate, unit: "/min", icon: Wind, danger: latestVital.respiratoryRate > 25 },
                  { label: "Trend", value: vitals.length > 1 && vitals[vitals.length-1].spo2 < vitals[vitals.length-2].spo2 ? "↓" : "→", unit: "", icon: vitals.length > 1 && vitals[vitals.length-1].spo2 < vitals[vitals.length-2].spo2 ? TrendingDown : TrendingUp, danger: vitals.length > 1 && vitals[vitals.length-1].spo2 < vitals[vitals.length-2].spo2 },
                ].map((v, i) => (
                  <div key={i} className={`p-3 rounded-xl border ${v.danger ? "border-rose-500/30 bg-rose-500/5" : "border-border/30 bg-background/50"}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <v.icon className={`size-3 ${v.danger ? "text-rose-500" : "text-muted-foreground"}`} />
                      <span className="text-[10px] text-muted-foreground uppercase">{v.label}</span>
                    </div>
                    <p className={`text-lg font-bold ${v.danger ? "text-rose-500" : ""}`}>{v.value}<span className="text-xs font-normal text-muted-foreground ml-0.5">{v.unit}</span></p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vitals History */}
          <div className="p-5 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl">
            <h3 className="font-semibold text-lg mb-4">Vitals History ({vitals.length} readings)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 rounded-l-lg text-left">Time</th>
                    <th className="px-3 py-2 text-left">BP</th>
                    <th className="px-3 py-2 text-left">HR</th>
                    <th className="px-3 py-2 text-left">SpO2</th>
                    <th className="px-3 py-2 text-left">Temp</th>
                    <th className="px-3 py-2 rounded-r-lg text-left">RR</th>
                  </tr>
                </thead>
                <tbody>
                  {vitals.slice().reverse().slice(0, 10).map((v) => (
                    <tr key={v.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20">
                      <td className="px-3 py-2.5 text-muted-foreground">{timeAgo(v.recordedAt)}</td>
                      <td className={`px-3 py-2.5 font-medium ${v.bpSystolic > 160 || v.bpSystolic < 90 ? "text-rose-500" : ""}`}>{v.bpSystolic}/{v.bpDiastolic}</td>
                      <td className={`px-3 py-2.5 ${v.heartRate > 120 ? "text-rose-500 font-medium" : ""}`}>{v.heartRate}</td>
                      <td className={`px-3 py-2.5 ${v.spo2 < 92 ? "text-rose-500 font-bold" : ""}`}>{v.spo2}%</td>
                      <td className={`px-3 py-2.5 ${v.temperature > 38.5 ? "text-rose-500" : ""}`}>{v.temperature}°C</td>
                      <td className="px-3 py-2.5">{v.respiratoryRate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Clinical Notes */}
          <div className="p-5 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <FileText className="size-5 text-primary" /> Clinical Notes
            </h3>
            <div className="flex flex-col gap-3">
              {notes.slice(0, 6).map((note) => (
                <div key={note.id} className="p-3 rounded-lg bg-background/50 border border-border/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-primary">{note.authorName}</span>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(note.createdAt)} · {note.noteType}</span>
                  </div>
                  <p className="text-sm text-foreground/80">{note.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Prescription Letters */}
          <div className="p-5 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <ScrollText className="size-5 text-primary" /> Prescription Letters
              {prescriptionLetters.length > 0 && (
                <span className="ml-auto text-xs text-muted-foreground font-normal">
                  {prescriptionLetters.length} letter{prescriptionLetters.length !== 1 ? "s" : ""}
                </span>
              )}
            </h3>
            {prescriptionLetters.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {prescriptionLetters.map((letter) => (
                  <PrescriptionLetterCard key={letter.id} letter={letter} />
                ))}
              </div>
            ) : (
              <NoPrescriptionsState />
            )}
          </div>
        </div>

        {/* Right: Diagnoses + Prescriptions */}
        <div className="flex flex-col gap-6">
          {/* Diagnoses */}
          <div className="p-5 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Stethoscope className="size-5 text-primary" /> Diagnoses
            </h3>
            <div className="flex flex-col gap-2.5">
              {diagnoses.map((d) => (
                <div key={d.id} className="p-3 rounded-lg bg-background/50 border border-border/30">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-semibold">{d.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${d.severity === "severe" ? "bg-rose-500/10 text-rose-500" : d.severity === "moderate" ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                      {d.severity}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{d.icdCode} · {d.description}</p>
                  <span className={`text-[10px] mt-1 inline-block px-1.5 py-0.5 rounded ${d.status === "active" ? "bg-blue-500/10 text-blue-500" : d.status === "chronic" ? "bg-purple-500/10 text-purple-500" : "bg-green-500/10 text-green-500"}`}>
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Prescriptions */}
          <div className="p-5 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Pill className="size-5 text-primary" /> Prescriptions
            </h3>
            <div className="flex flex-col gap-2">
              {prescriptions.map((rx) => (
                <div key={rx.id} className="p-2.5 rounded-lg bg-background/50 border border-border/30">
                  <p className="text-sm font-semibold">{rx.medicationName}</p>
                  <p className="text-xs text-muted-foreground">{rx.dosage} · {rx.frequency}</p>
                  <p className="text-[10px] text-muted-foreground/70">Route: {rx.route} · {rx.status}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Patient Info */}
          <div className="p-5 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <ClipboardList className="size-5 text-primary" /> Patient Info
            </h3>
            <div className="flex flex-col gap-2 text-sm">
              {[
                ["Ward", patient.wardName],
                ["Doctor", patient.assignedDoctorName],
                ["Admitted", new Date(patient.admissionDate).toLocaleDateString()],
                ["Status", patient.status.replace("_", " ").toUpperCase()],
                ["Contact", patient.contactNumber],
                ["Emergency", patient.emergencyContact],
                ["Address", patient.address],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-right max-w-[60%] truncate">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Panel */}
      <AIPanel
        patientContext={patientContext}
        isOpen={aiPanelOpen}
        onClose={() => setAiPanelOpen(false)}
      />

      {/* AI Panel Toggle Button */}
      {!aiPanelOpen && (
        <AIPanelButton onClick={() => setAiPanelOpen(true)} />
      )}
    </div>
  );
}

// ─── Main Doctor Dashboard ────────────────────────────────────────────────────

export function DoctorDashboard() {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");

  const allPatients = getPatients({ status: undefined });
  const activePatients = allPatients.filter(p => p.status !== "discharged");
  const alerts = getAlerts({ acknowledged: false });
  const riskDist = getRiskDistribution();

  // Filter patients
  let filteredPatients = activePatients;
  if (riskFilter !== "all") {
    filteredPatients = filteredPatients.filter(p => p.riskLevel === riskFilter);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredPatients = filteredPatients.filter(p =>
      p.fullName.toLowerCase().includes(q) || p.mrn.toLowerCase().includes(q) || p.roomNumber.toLowerCase().includes(q)
    );
  }

  // If viewing a patient detail
  if (selectedPatientId) {
    return <PatientDetailView patientId={selectedPatientId} onBack={() => setSelectedPatientId(null)} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Clinical Dashboard</h2>
        <p className="text-muted-foreground text-sm">{activePatients.length} active patients · {alerts.length} unacknowledged alerts</p>
      </motion.div>

      {/* Risk Distribution Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["critical", "high", "medium", "low"] as const).map((level, i) => (
          <motion.button key={level} onClick={() => setRiskFilter(riskFilter === level ? "all" : level)}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
            className={`p-4 rounded-xl border transition-all ${riskFilter === level ? `${RISK_BG[level]} ring-2 ring-offset-1` : "border-border/50 bg-card/40 hover:border-primary/30"}`}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`size-2.5 rounded-full ${RISK_COLORS[level]}`} />
              <span className="text-xs text-muted-foreground uppercase font-semibold">{level}</span>
            </div>
            <p className="text-2xl font-bold">{riskDist[level]}</p>
          </motion.button>
        ))}
      </div>

      {/* Top Alert Banner */}
      {alerts.length > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="flex items-center justify-between p-4 rounded-xl border border-rose-500/30 bg-rose-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 rounded-lg">
              <AlertTriangle className="size-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-700 dark:text-rose-400">{alerts.length} Active Alerts</p>
              <p className="text-xs text-rose-600/80 dark:text-rose-400/80">{alerts[0]?.message}</p>
            </div>
          </div>
          <button onClick={() => { if (alerts[0]) { acknowledgeAlert(alerts[0].id); } }}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shrink-0">
            Acknowledge
          </button>
        </motion.div>
      )}

      {/* Search + Patient List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Users className="size-5 text-primary" /> All Patients
            <span className="text-xs text-muted-foreground font-normal">({filteredPatients.length})</span>
          </h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patients..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>

        <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto">
          {filteredPatients.slice(0, 50).map((p) => {
            const latestV = getLatestVitals(p.id);
            return (
              <button key={p.id} onClick={() => setSelectedPatientId(p.id)}
                className="group flex items-center justify-between p-4 rounded-xl border border-border/40 bg-background/50 hover:border-primary/40 hover:bg-primary/5 transition-all text-left">
                <div className="flex items-center gap-4">
                  <div className={`size-2.5 rounded-full ${RISK_COLORS[p.riskLevel]} ${p.riskLevel === "critical" ? "animate-pulse" : ""}`} />
                  <div>
                    <p className="font-semibold">{p.fullName}</p>
                    <p className="text-xs text-muted-foreground">{p.mrn} · Room {p.roomNumber} · {p.wardName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {latestV && (
                    <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
                      <span>BP: {latestV.bpSystolic}/{latestV.bpDiastolic}</span>
                      <span>HR: {latestV.heartRate}</span>
                      <span className={latestV.spo2 < 92 ? "text-rose-500 font-bold" : ""}>SpO2: {latestV.spo2}%</span>
                    </div>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${RISK_BG[p.riskLevel]} ${RISK_TEXT[p.riskLevel]}`}>
                    {p.riskLevel}
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
