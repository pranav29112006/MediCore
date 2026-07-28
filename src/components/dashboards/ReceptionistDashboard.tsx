import { useState } from "react";
import { motion } from "motion/react";
import {
  UserPlus, CalendarDays, BedDouble, Search, ChevronRight,
  X, CheckCircle2, Users, Clock, ArrowLeft,
  Activity, Heart, Thermometer, Stethoscope,
} from "lucide-react";
import {
  searchPatients, getRecentAdmissions, getWards, getHospitalStats,
  addPatient, getActivePatients, getPatients, getWardOccupancy,
  getPatientById, getDiagnoses, getLatestVitals, getRiskScore,
} from "../../lib/data-service";
import type { Patient, Ward, BloodGroup, Gender } from "../../lib/types";

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

// ─── Patient Registration Form ────────────────────────────────────────────────

function RegistrationForm({ onClose, onRegistered }: { onClose: () => void; onRegistered: (p: Patient) => void }) {
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>("O+");
  const [contact, setContact] = useState("");
  const [emergency, setEmergency] = useState("");
  const [address, setAddress] = useState("");
  const [wardId, setWardId] = useState("ward-01");
  const [saved, setSaved] = useState(false);

  const wards = getWards();
  const selectedWard = wards.find(w => w.id === wardId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const ageNum = parseInt(age) || 30;
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - ageNum);

    const patient = addPatient({
      fullName: fullName.trim(),
      age: ageNum,
      dob: dob.toISOString().split("T")[0],
      gender,
      bloodGroup,
      contactNumber: contact || "+91 00000 00000",
      emergencyContact: emergency || "+91 00000 00000",
      address: address || "Address not provided",
      admissionDate: new Date().toISOString(),
      dischargeDate: null,
      status: "admitted",
      wardId,
      wardName: selectedWard?.name || "General Ward",
      roomNumber: `${wardId.replace("ward-","")}-${String(Math.floor(Math.random() * 30) + 1).padStart(2,"0")}`,
      assignedDoctorId: null,
      assignedDoctorName: "Pending Assignment",
      riskLevel: "low",
    });

    setSaved(true);
    setTimeout(() => onRegistered(patient), 1500);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        {saved ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
              <CheckCircle2 className="size-16 text-emerald-500" />
            </motion.div>
            <p className="text-lg font-semibold">Patient Registered!</p>
            <p className="text-sm text-muted-foreground">{fullName} has been admitted.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold">Register New Patient</h3>
                <p className="text-sm text-muted-foreground">Fill in patient demographics and assign a ward.</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Full Name */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Full Name *</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter patient's full name" required
                  className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Age */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Age *</label>
                  <input type="number" value={age} onChange={(e) => setAge(e.target.value)}
                    placeholder="30" min="0" max="120" required
                    className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                {/* Gender */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Gender</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {/* Blood Group */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Blood Group</label>
                  <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                    className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50">
                    {(["A+","A-","B+","B-","AB+","AB-","O+","O-"] as BloodGroup[]).map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Contact Number</label>
                  <input type="tel" value={contact} onChange={(e) => setContact(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Emergency Contact</label>
                  <input type="tel" value={emergency} onChange={(e) => setEmergency(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>

              {/* Address */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Address</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)}
                  placeholder="Patient's address" rows={2}
                  className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
              </div>

              {/* Ward Selection */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Assign Ward *</label>
                <select value={wardId} onChange={(e) => setWardId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50">
                  {wards.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.department}) — {w.occupiedBeds}/{w.totalBeds} beds</option>
                  ))}
                </select>
              </div>

              <button type="submit"
                className="mt-2 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">
                <UserPlus className="size-4" /> Register & Admit
              </button>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Patient Search Result ────────────────────────────────────────────────────

function PatientCard({ patient, onClick }: { patient: Patient; onClick: () => void }) {
  const vitals = getLatestVitals(patient.id);

  return (
    <button onClick={onClick}
      className="group w-full flex items-center justify-between p-4 rounded-xl border border-border/40 bg-background/50 hover:border-primary/40 hover:bg-primary/5 transition-all text-left">
      <div className="flex items-center gap-4">
        <div className={`size-2.5 rounded-full ${RISK_COLORS[patient.riskLevel]}`} />
        <div>
          <p className="font-semibold">{patient.fullName}</p>
          <p className="text-xs text-muted-foreground">
            {patient.mrn} · {patient.age}y/{patient.gender[0].toUpperCase()} · {patient.bloodGroup} · Room {patient.roomNumber}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-[10px] px-2 py-1 rounded-full font-semibold uppercase ${patient.status === "discharged" ? "bg-gray-500/10 text-gray-500" : "bg-blue-500/10 text-blue-500"}`}>
          {patient.status.replace("_", " ")}
        </span>
        <span className="text-xs text-muted-foreground">{patient.wardName}</span>
        <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </button>
  );
}

// ─── Patient Quick View (Receptionist - limited clinical info) ─────────────────

function PatientInfoView({ patient, onBack }: { patient: Patient; onBack: () => void }) {
  const diagnoses = getDiagnoses(patient.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <h3 className="font-semibold text-lg">{patient.fullName}</h3>
          <p className="text-xs text-muted-foreground">{patient.mrn}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          ["Age / Gender", `${patient.age}y / ${patient.gender}`],
          ["Blood Group", patient.bloodGroup],
          ["Ward", patient.wardName],
          ["Room", patient.roomNumber],
          ["Doctor", patient.assignedDoctorName],
          ["Status", patient.status.replace("_"," ").toUpperCase()],
          ["Admitted", new Date(patient.admissionDate).toLocaleDateString()],
          ["Contact", patient.contactNumber],
          ["Emergency", patient.emergencyContact],
          ["Address", patient.address],
        ].map(([label, value]) => (
          <div key={label} className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">{label}</span>
            <span className="text-sm font-medium">{value}</span>
          </div>
        ))}
      </div>

      {diagnoses.length > 0 && (
        <div>
          <h4 className="text-xs text-muted-foreground uppercase font-semibold mb-2">Diagnoses</h4>
          <div className="flex flex-wrap gap-2">
            {diagnoses.map(d => (
              <span key={d.id} className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {d.name} ({d.icdCode})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Receptionist Dashboard ──────────────────────────────────────────────

export function ReceptionistDashboard() {
  const [showRegistration, setShowRegistration] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [, forceUpdate] = useState(0);

  const stats = getHospitalStats();
  const recentAdmissions = getRecentAdmissions(3).slice(0, 8);
  const wardOccupancy = getWardOccupancy();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      setSearchResults(searchPatients(query));
    } else {
      setSearchResults([]);
    }
  };

  const handleRegistered = (patient: Patient) => {
    setShowRegistration(false);
    setSearchQuery(patient.fullName);
    setSearchResults([patient]);
    forceUpdate(n => n + 1);
  };

  return (
    <div className="flex flex-col gap-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Front Desk</h2>
        <p className="text-muted-foreground text-sm">Patient registration, admissions, and bed management.</p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Patients", value: stats.totalPatients, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Admitted Today", value: stats.admittedToday, icon: CalendarDays, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Discharged Today", value: stats.dischargedToday, icon: CheckCircle2, color: "text-violet-500", bg: "bg-violet-500/10" },
          { label: "ICU Patients", value: stats.icuPatients, icon: Activity, color: "text-rose-500", bg: "bg-rose-500/10" },
        ].map((stat, i) => (
          <motion.div key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
            className="p-4 rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                <stat.icon className={`size-3.5 ${stat.color}`} />
              </div>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.button onClick={() => setShowRegistration(true)}
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="p-5 rounded-2xl border border-primary/30 bg-primary/5 backdrop-blur-xl shadow-sm flex flex-col items-center justify-center gap-3 hover:border-primary/60 hover:bg-primary/10 transition-all cursor-pointer">
          <div className="p-4 rounded-full bg-primary/10">
            <UserPlus className="size-6 text-primary" />
          </div>
          <span className="font-semibold">Register New Patient</span>
        </motion.button>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="p-5 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm flex flex-col items-center justify-center gap-2">
          <p className="text-3xl font-bold text-emerald-500">{stats.occupancyRate}%</p>
          <span className="text-sm text-muted-foreground">Hospital Occupancy</span>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden mt-1">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${stats.occupancyRate}%` }} />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          className="p-5 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm flex flex-col items-center justify-center gap-2">
          <p className="text-3xl font-bold text-amber-500">{stats.activeAlerts}</p>
          <span className="text-sm text-muted-foreground">Active Alerts</span>
          <p className="text-xs text-muted-foreground">{stats.highRiskPatients} high-risk patients</p>
        </motion.div>
      </div>

      {/* Patient Search */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Patient Search</h3>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 size-5 text-muted-foreground" />
          <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name, MRN, phone number, or ward..."
            className="w-full pl-11 pr-4 py-3 bg-background border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
        </div>

        {selectedPatient ? (
          <PatientInfoView patient={selectedPatient} onBack={() => setSelectedPatient(null)} />
        ) : searchResults.length > 0 ? (
          <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
            {searchResults.map(p => (
              <PatientCard key={p.id} patient={p} onClick={() => setSelectedPatient(p)} />
            ))}
          </div>
        ) : searchQuery.length >= 2 ? (
          <div className="text-center py-8 border-2 border-dashed border-border/50 rounded-xl">
            <p className="text-muted-foreground text-sm">No patients found for "{searchQuery}".</p>
          </div>
        ) : (
          <div className="text-center py-6 border-2 border-dashed border-border/50 rounded-xl">
            <p className="text-muted-foreground text-sm">Type at least 2 characters to search patient records.</p>
          </div>
        )}
      </motion.div>

      {/* Recent Admissions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm flex flex-col gap-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <CalendarDays className="size-5 text-primary" /> Recent Admissions (Last 3 Days)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">MRN</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Age/Gender</th>
                <th className="px-4 py-3">Ward</th>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3 rounded-r-lg">Admitted</th>
              </tr>
            </thead>
            <tbody>
              {recentAdmissions.map((p) => (
                <tr key={p.id} onClick={() => setSelectedPatient(p)}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer">
                  <td className="px-4 py-3 font-mono text-xs text-primary">{p.mrn}</td>
                  <td className="px-4 py-3 font-medium">{p.fullName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.age}y / {p.gender[0].toUpperCase()}</td>
                  <td className="px-4 py-3">{p.wardName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.roomNumber}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.assignedDoctorName}</td>
                  <td className="px-4 py-3 text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3" /> {timeAgo(p.admissionDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Bed Availability */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm flex flex-col gap-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <BedDouble className="size-5 text-primary" /> Bed Availability by Ward
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {wardOccupancy.map((w) => (
            <div key={w.name} className="p-3 rounded-lg border border-border/30 bg-background/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{w.name}</span>
                <span className={`text-xs font-semibold ${w.percent > 90 ? "text-rose-500" : w.percent > 70 ? "text-amber-500" : "text-emerald-500"}`}>
                  {w.total - w.occupied} available
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full transition-all ${w.percent > 90 ? "bg-rose-500" : w.percent > 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${w.percent}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{w.occupied}/{w.total} beds · {w.percent}%</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Registration Modal */}
      {showRegistration && (
        <RegistrationForm onClose={() => setShowRegistration(false)} onRegistered={handleRegistered} />
      )}
    </div>
  );
}
