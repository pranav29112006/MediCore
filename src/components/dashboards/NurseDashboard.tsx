import { useState } from "react";
import { motion } from "motion/react";
import {
  Activity, Plus, HeartPulse, Clock, Search, ChevronRight,
  Heart, Thermometer, Wind, ArrowLeft, CheckCircle2, X,
  Users, AlertTriangle,
} from "lucide-react";
import {
  getWards, getPatientsByWard, getRecentVitalsByWard,
  getLatestVitals, addVital, getPatientById, getVitals,
  getDiagnoses, getRiskScore, getAlerts,
} from "../../lib/data-service";
import type { Ward, Patient, Vital } from "../../lib/types";

const RISK_COLORS: Record<string, string> = {
  critical: "bg-red-500", high: "bg-rose-500", medium: "bg-amber-500", low: "bg-emerald-500",
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Vitals Entry Form ────────────────────────────────────────────────────────

function VitalsEntryForm({ patient, onClose, onSaved }: { patient: Patient; onClose: () => void; onSaved: () => void }) {
  const [bpSys, setBpSys] = useState("");
  const [bpDia, setBpDia] = useState("");
  const [hr, setHr] = useState("");
  const [spo2, setSpo2] = useState("");
  const [temp, setTemp] = useState("");
  const [rr, setRr] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addVital({
      patientId: patient.id,
      bpSystolic: parseInt(bpSys) || 120,
      bpDiastolic: parseInt(bpDia) || 80,
      heartRate: parseInt(hr) || 72,
      spo2: parseInt(spo2) || 98,
      temperature: parseFloat(temp) || 36.8,
      respiratoryRate: parseInt(rr) || 16,
      recordedAt: new Date().toISOString(),
      recordedBy: "Current Nurse",
    });
    setSaved(true);
    setTimeout(() => { onSaved(); onClose(); }, 1200);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}>
        {saved ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
              <CheckCircle2 className="size-16 text-emerald-500" />
            </motion.div>
            <p className="text-lg font-semibold">Vitals Recorded!</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold">Record Vitals</h3>
                <p className="text-sm text-muted-foreground">{patient.fullName} · Room {patient.roomNumber}</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "BP Systolic", value: bpSys, set: setBpSys, placeholder: "120", unit: "mmHg", icon: Heart },
                  { label: "BP Diastolic", value: bpDia, set: setBpDia, placeholder: "80", unit: "mmHg", icon: Heart },
                  { label: "Heart Rate", value: hr, set: setHr, placeholder: "72", unit: "bpm", icon: Activity },
                  { label: "SpO2", value: spo2, set: setSpo2, placeholder: "98", unit: "%", icon: Wind },
                  { label: "Temperature", value: temp, set: setTemp, placeholder: "36.8", unit: "°C", icon: Thermometer },
                  { label: "Resp. Rate", value: rr, set: setRr, placeholder: "16", unit: "/min", icon: Wind },
                ].map((field) => (
                  <div key={field.label} className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">{field.label}</label>
                    <div className="relative">
                      <field.icon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                      <input type="text" value={field.value} onChange={(e) => field.set(e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full pl-8 pr-12 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      <span className="absolute right-2.5 top-2.5 text-[10px] text-muted-foreground">{field.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button type="submit"
                className="mt-2 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">
                <Plus className="size-4" /> Save Vitals
              </button>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Patient Vitals Quick View ─────────────────────────────────────────────────

function PatientQuickView({ patient, onBack, onRecordVitals }: { patient: Patient; onBack: () => void; onRecordVitals: () => void }) {
  const vitals = getVitals(patient.id);
  const diagnoses = getDiagnoses(patient.id);
  const risk = getRiskScore(patient.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{patient.fullName}</h3>
          <p className="text-xs text-muted-foreground">{patient.mrn} · Room {patient.roomNumber} · {patient.age}y/{patient.gender[0].toUpperCase()}</p>
        </div>
        <button onClick={onRecordVitals}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="size-4" /> Record Vitals
        </button>
      </div>

      {/* Diagnoses */}
      <div className="flex flex-wrap gap-2">
        {diagnoses.map(d => (
          <span key={d.id} className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            {d.name}
          </span>
        ))}
      </div>

      {/* Risk */}
      {risk && (
        <div className={`p-3 rounded-lg border ${risk.score === "critical" || risk.score === "high" ? "border-rose-500/30 bg-rose-500/10" : "border-border/50 bg-muted/30"}`}>
          <p className="text-sm"><span className="font-semibold">Risk: {risk.score.toUpperCase()}</span> ({risk.numericScore}/100) — {risk.explanation.slice(0, 120)}...</p>
        </div>
      )}

      {/* Vitals Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
            <tr>
              <th className="px-3 py-2 rounded-l-lg text-left">Time</th>
              <th className="px-3 py-2 text-left">BP</th>
              <th className="px-3 py-2 text-left">HR</th>
              <th className="px-3 py-2 text-left">SpO2</th>
              <th className="px-3 py-2 text-left">Temp</th>
              <th className="px-3 py-2 text-left">RR</th>
              <th className="px-3 py-2 rounded-r-lg text-left">By</th>
            </tr>
          </thead>
          <tbody>
            {vitals.slice().reverse().map((v) => (
              <tr key={v.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20">
                <td className="px-3 py-2.5 text-muted-foreground">{timeAgo(v.recordedAt)}</td>
                <td className={`px-3 py-2.5 font-medium ${v.bpSystolic > 160 || v.bpSystolic < 90 ? "text-rose-500" : ""}`}>{v.bpSystolic}/{v.bpDiastolic}</td>
                <td className={`px-3 py-2.5 ${v.heartRate > 120 ? "text-rose-500 font-medium" : ""}`}>{v.heartRate}</td>
                <td className={`px-3 py-2.5 ${v.spo2 < 92 ? "text-rose-500 font-bold" : ""}`}>{v.spo2}%</td>
                <td className={`px-3 py-2.5 ${v.temperature > 38.5 ? "text-rose-500" : ""}`}>{v.temperature}°C</td>
                <td className="px-3 py-2.5">{v.respiratoryRate}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">{v.recordedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Nurse Dashboard ─────────────────────────────────────────────────────

export function NurseDashboard() {
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [vitalsPatient, setVitalsPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [, forceUpdate] = useState(0);

  const wards = getWards();
  const alerts = getAlerts({ acknowledged: false });
  const criticalAlerts = alerts.filter(a => a.severity === "critical" || a.severity === "high");

  // If viewing a patient detail
  if (selectedPatient) {
    return (
      <div className="flex flex-col gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">Ward Overview</h2>
        </motion.div>
        <div className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm">
          <PatientQuickView
            patient={selectedPatient}
            onBack={() => setSelectedPatient(null)}
            onRecordVitals={() => setVitalsPatient(selectedPatient)}
          />
        </div>
        {vitalsPatient && (
          <VitalsEntryForm
            patient={vitalsPatient}
            onClose={() => setVitalsPatient(null)}
            onSaved={() => forceUpdate(n => n + 1)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Ward Overview</h2>
        <p className="text-muted-foreground text-sm">Monitor patients and record vitals across all wards.</p>
      </motion.div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="size-5 text-rose-500" />
            <span className="text-sm font-bold text-rose-700 dark:text-rose-400">{criticalAlerts.length} Critical Alerts in Your Wards</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {criticalAlerts.slice(0, 3).map(a => (
              <p key={a.id} className="text-xs text-rose-600/80 dark:text-rose-400/80">• {a.message}</p>
            ))}
          </div>
        </motion.div>
      )}

      {/* Ward Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wards.map((w, i) => {
          const wardPatients = getPatientsByWard(w.id);
          const critical = wardPatients.filter(p => p.riskLevel === "critical" || p.riskLevel === "high").length;
          const isSelected = selectedWard === w.id;

          return (
            <motion.button key={w.id} onClick={() => setSelectedWard(isSelected ? null : w.id)}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
              className={`p-4 rounded-xl border text-left transition-all ${isSelected ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border/50 bg-card/40 hover:border-primary/30"}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">{w.name}</h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-primary/10 text-primary">
                  {wardPatients.length}/{w.totalBeds}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{w.department} · Floor {w.floor}</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Users className="size-3 text-muted-foreground" />
                  <span className="text-xs">{wardPatients.length} patients</span>
                </div>
                {critical > 0 && (
                  <div className="flex items-center gap-1.5 text-rose-500">
                    <Activity className="size-3" />
                    <span className="text-xs font-semibold">{critical} critical</span>
                  </div>
                )}
              </div>
              {/* Occupancy bar */}
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all bg-primary"
                  style={{ width: `${Math.min(100, Math.round((wardPatients.length / w.totalBeds) * 100))}%` }} />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Selected Ward Patients */}
      {selectedWard && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <HeartPulse className="size-5 text-primary" />
              {wards.find(w => w.id === selectedWard)?.name} — Patients
            </h3>
            <div className="relative w-56">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 rounded-lg">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Patient</th>
                  <th className="px-4 py-3">Room</th>
                  <th className="px-4 py-3">BP</th>
                  <th className="px-4 py-3">Heart Rate</th>
                  <th className="px-4 py-3">SpO2</th>
                  <th className="px-4 py-3">Temp</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Last Vitals</th>
                  <th className="px-4 py-3 rounded-r-lg">Action</th>
                </tr>
              </thead>
              <tbody>
                {getPatientsByWard(selectedWard)
                  .filter(p => !searchQuery || p.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((p) => {
                    const v = getLatestVitals(p.id);
                    return (
                      <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium">{p.fullName}</td>
                        <td className="px-4 py-3 text-muted-foreground">{p.roomNumber}</td>
                        <td className={`px-4 py-3 ${v && (v.bpSystolic > 160 || v.bpSystolic < 90) ? "text-rose-500 font-medium" : ""}`}>
                          {v ? `${v.bpSystolic}/${v.bpDiastolic}` : "—"}
                        </td>
                        <td className={`px-4 py-3 ${v && v.heartRate > 120 ? "text-rose-500" : ""}`}>
                          {v ? `${v.heartRate} bpm` : "—"}
                        </td>
                        <td className={`px-4 py-3 ${v && v.spo2 < 92 ? "text-rose-500 font-bold" : ""}`}>
                          {v ? `${v.spo2}%` : "—"}
                        </td>
                        <td className={`px-4 py-3 ${v && v.temperature > 38.5 ? "text-rose-500" : ""}`}>
                          {v ? `${v.temperature}°C` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className={`size-2 rounded-full ${RISK_COLORS[p.riskLevel]}`} />
                            <span className="text-xs capitalize">{p.riskLevel}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground flex items-center gap-1">
                          <Clock className="size-3" />
                          <span className="text-xs">{v ? timeAgo(v.recordedAt) : "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => setSelectedPatient(p)}
                              className="text-xs text-primary hover:underline">View</button>
                            <button onClick={() => setVitalsPatient(p)}
                              className="text-xs px-2 py-1 bg-primary text-white rounded hover:bg-primary/90 transition-colors">
                              <Plus className="size-3 inline" /> Vitals
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Vitals Entry Modal */}
      {vitalsPatient && (
        <VitalsEntryForm
          patient={vitalsPatient}
          onClose={() => setVitalsPatient(null)}
          onSaved={() => forceUpdate(n => n + 1)}
        />
      )}
    </div>
  );
}
