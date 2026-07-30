import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText, X, Calendar, User, Building2, Pill, AlertCircle,
  ChevronRight, Printer, Download, Clock, RefreshCw, Stethoscope,
} from "lucide-react";
import type { PrescriptionLetter } from "../../lib/types";

// ─── Full Prescription Modal ──────────────────────────────────────────────────

function PrescriptionModal({
  letter,
  onClose,
}: {
  letter: PrescriptionLetter;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
        >
          <X className="size-5" />
        </button>

        {/* Prescription Document */}
        <div className="p-8 md:p-12 text-gray-900">
          {/* Hospital Header */}
          <div className="text-center border-b-2 border-blue-600 pb-6 mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Building2 className="size-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-blue-900 tracking-tight">
                  {letter.hospitalName}
                </h1>
                <p className="text-xs text-gray-500 tracking-widest uppercase">
                  Multi-Speciality Hospital & Research Centre
                </p>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              123 Medical Drive, Health City, Karnataka 560001 · Tel: +91 80 4567 8900 · NABH Accredited
            </p>
          </div>

          {/* Prescription Title */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-serif font-bold text-blue-700">℞</span>
              <div>
                <h2 className="text-lg font-bold text-gray-900">PRESCRIPTION</h2>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                  {letter.isRefill ? "Refill Prescription" : "Original Prescription"}
                </p>
              </div>
            </div>
            <div className="text-right text-sm">
              <p className="text-gray-500">
                <span className="font-medium text-gray-700">Date:</span>{" "}
                {new Date(letter.dateIssued).toLocaleDateString("en-IN", {
                  day: "2-digit", month: "long", year: "numeric",
                })}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Rx ID: {letter.id.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Patient & Doctor Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
            <div>
              <h3 className="text-[10px] uppercase text-gray-400 font-semibold tracking-wider mb-2">
                Patient Details
              </h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-gray-500">Name:</span>{" "}
                  <span className="font-semibold">{letter.patientName}</span>
                </p>
                <p>
                  <span className="text-gray-500">Age/Gender:</span>{" "}
                  <span className="font-medium">{letter.patientAge} yrs / {letter.patientGender.charAt(0).toUpperCase() + letter.patientGender.slice(1)}</span>
                </p>
                <p>
                  <span className="text-gray-500">MRN:</span>{" "}
                  <span className="font-mono text-xs">{letter.patientMRN}</span>
                </p>
                <p>
                  <span className="text-gray-500">Room:</span>{" "}
                  <span className="font-medium">{letter.patientRoom}</span>
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-[10px] uppercase text-gray-400 font-semibold tracking-wider mb-2">
                Prescribing Doctor
              </h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-gray-500">Doctor:</span>{" "}
                  <span className="font-semibold">{letter.doctorName}</span>
                </p>
                <p>
                  <span className="text-gray-500">Reg. No:</span>{" "}
                  <span className="font-mono text-xs">{letter.doctorRegNo}</span>
                </p>
                <p>
                  <span className="text-gray-500">Department:</span>{" "}
                  <span className="font-medium">{letter.department}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Diagnosis */}
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-[10px] uppercase text-blue-400 font-semibold tracking-wider mb-1">
              Diagnosis
            </p>
            <p className="text-sm font-semibold text-blue-900">{letter.diagnosis}</p>
          </div>

          {/* Medications Table */}
          <div className="mb-6">
            <h3 className="text-xs uppercase text-gray-400 font-semibold tracking-wider mb-3 flex items-center gap-1.5">
              <Pill className="size-3.5" /> Medications Prescribed
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600">
                    <th className="text-left px-3 py-2.5 rounded-l-lg font-semibold text-[11px] uppercase">#</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-[11px] uppercase">Medication</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-[11px] uppercase">Dosage</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-[11px] uppercase">Frequency</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-[11px] uppercase">Route</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-[11px] uppercase">Duration</th>
                    <th className="text-left px-3 py-2.5 rounded-r-lg font-semibold text-[11px] uppercase">Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  {letter.medications.map((med, i) => (
                    <tr
                      key={i}
                      className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}
                    >
                      <td className="px-3 py-2.5 text-gray-400 font-mono text-xs">{i + 1}</td>
                      <td className="px-3 py-2.5 font-semibold text-gray-900">{med.name}</td>
                      <td className="px-3 py-2.5 text-gray-700">{med.dosage}</td>
                      <td className="px-3 py-2.5 text-gray-700">{med.frequency}</td>
                      <td className="px-3 py-2.5">
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded">
                          {med.route}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-600 text-xs">{med.duration}</td>
                      <td className="px-3 py-2.5 text-gray-500 text-xs italic">{med.instructions || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <h3 className="text-xs uppercase text-amber-600 font-semibold tracking-wider mb-2 flex items-center gap-1.5">
              <AlertCircle className="size-3.5" /> Special Instructions
            </h3>
            <p className="text-sm text-amber-900 leading-relaxed">{letter.specialInstructions}</p>
          </div>

          {/* Follow-Up & Footer */}
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 pt-6 border-t-2 border-gray-200">
            <div>
              {letter.followUpDate && (
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="size-4 text-gray-400" />
                  <p className="text-sm">
                    <span className="text-gray-500">Follow-Up:</span>{" "}
                    <span className="font-semibold text-gray-800">
                      {new Date(letter.followUpDate).toLocaleDateString("en-IN", {
                        day: "2-digit", month: "long", year: "numeric",
                      })}
                    </span>
                  </p>
                </div>
              )}
              <p className="text-[10px] text-gray-400 italic mt-2">
                This is a computer-generated prescription. Valid only with the doctor's digital signature.
              </p>
            </div>
            <div className="text-right">
              <div className="w-48 border-b-2 border-gray-300 mb-1" />
              <p className="text-sm font-semibold text-gray-700">{letter.doctorName}</p>
              <p className="text-[10px] text-gray-500">{letter.department}</p>
              <p className="text-[10px] text-gray-400">{letter.doctorRegNo}</p>
            </div>
          </div>

          {/* Watermark */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.02] select-none">
            <p className="text-[120px] font-bold text-gray-900 rotate-[-30deg] whitespace-nowrap">
              PRESCRIPTION
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Prescription Letter Card ─────────────────────────────────────────────────

export function PrescriptionLetterCard({
  letter,
}: {
  letter: PrescriptionLetter;
}) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <motion.button
        onClick={() => setShowModal(true)}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="group relative p-4 rounded-xl border border-border/40 bg-background/50 hover:border-primary/40 hover:bg-primary/5 transition-all text-left overflow-hidden"
      >
        {/* Refill Badge */}
        {letter.isRefill && (
          <div className="absolute top-2 right-2">
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[9px] font-bold rounded-full">
              <RefreshCw className="size-2.5" /> REFILL
            </span>
          </div>
        )}

        {/* Card Content */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
            <FileText className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate pr-12">{letter.diagnosis}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {letter.medications.length} medication{letter.medications.length !== 1 ? "s" : ""} · {letter.doctorName}
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground/70">
              <Calendar className="size-3" />
              {new Date(letter.dateIssued).toLocaleDateString("en-IN", {
                day: "2-digit", month: "short", year: "numeric",
              })}
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
        </div>
      </motion.button>

      <AnimatePresence>
        {showModal && (
          <PrescriptionModal letter={letter} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Empty State for New Patients ─────────────────────────────────────────────

export function NoPrescriptionsState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-border/50 bg-card/20"
    >
      <div className="p-4 rounded-2xl bg-muted/50 mb-4">
        <Stethoscope className="size-8 text-muted-foreground/50" />
      </div>
      <h4 className="text-lg font-semibold text-muted-foreground mb-1">New Patient</h4>
      <p className="text-sm text-muted-foreground/70 text-center max-w-xs">
        No prescription letters have been issued yet. Prescriptions will appear here once the doctor writes them.
      </p>
      <div className="mt-4 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-semibold">
        <Clock className="size-3" />
        Awaiting initial consultation
      </div>
    </motion.div>
  );
}
