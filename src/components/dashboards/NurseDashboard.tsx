import { motion } from "motion/react";
import { Activity, Plus, HeartPulse, Clock } from "lucide-react";

export function NurseDashboard() {
  const wards = [
    { name: "General Ward A", patients: 12, critical: 1 },
    { name: "ICU", patients: 4, critical: 3 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Ward Overview</h2>
        <p className="text-muted-foreground text-sm">Monitor patients and record vitals.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wards.map((w, i) => (
          <motion.div
            key={w.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="p-5 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{w.name}</h3>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                {w.patients} Patients
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-rose-500">
              <Activity className="size-4" />
              <span>{w.critical} Critical Alert(s)</span>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm flex flex-col gap-4"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <HeartPulse className="size-5 text-primary" /> Recent Vitals
          </h3>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="size-4" /> Record Vitals
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 rounded-lg">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Patient</th>
                <th className="px-4 py-3">BP</th>
                <th className="px-4 py-3">Heart Rate</th>
                <th className="px-4 py-3">SpO2</th>
                <th className="px-4 py-3 rounded-r-lg">Time</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((i) => (
                <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-4 font-medium">John Doe</td>
                  <td className="px-4 py-4">120/80</td>
                  <td className="px-4 py-4">72 bpm</td>
                  <td className="px-4 py-4">98%</td>
                  <td className="px-4 py-4 text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3" /> 10 mins ago
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
