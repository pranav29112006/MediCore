import { motion } from "motion/react";
import { Users, Activity, BrainCircuit, Stethoscope, ChevronRight } from "lucide-react";

export function DoctorDashboard() {
  const patients = [
    { id: 1, name: "Eleanor Pena", risk: "High", room: "ICU-04", time: "10m ago" },
    { id: 2, name: "Albert Flores", risk: "Medium", room: "W-201", time: "1h ago" },
    { id: 3, name: "Wade Warren", risk: "Low", room: "W-205", time: "3h ago" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Clinical Dashboard</h2>
        <p className="text-muted-foreground text-sm">Your assigned patients and AI risk insights.</p>
      </motion.div>

      {/* Alert Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between p-4 rounded-xl border border-rose-500/30 bg-rose-500/10"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/20 rounded-lg">
            <Activity className="size-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-rose-700 dark:text-rose-400">High Risk Alert</p>
            <p className="text-xs text-rose-600/80 dark:text-rose-400/80">Eleanor Pena (ICU-04) - SpO2 dropping rapidly.</p>
          </div>
        </div>
        <button className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors">
          View Patient
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
        {/* Patient List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Users className="size-5 text-primary" /> My Patients
            </h3>
            <button className="text-sm text-primary hover:underline">View All</button>
          </div>
          
          <div className="flex flex-col gap-3">
            {patients.map((p, i) => (
              <div key={p.id} className="group flex items-center justify-between p-4 rounded-xl border border-border/40 bg-background/50 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`size-2.5 rounded-full ${p.risk === 'High' ? 'bg-rose-500' : p.risk === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">Room: {p.room}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">{p.time}</span>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AI Actions Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-xl shadow-sm flex flex-col gap-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <BrainCircuit className="size-5 text-primary" />
            <h3 className="font-semibold text-lg text-primary">AI Copilot</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Generate clinical summaries or draft discharge notes based on recent vitals.</p>
          
          <button className="flex items-center justify-between p-4 rounded-xl bg-background border border-border/50 hover:border-primary/50 transition-colors group">
            <span className="text-sm font-medium">Generate Summary</span>
            <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary" />
          </button>
          <button className="flex items-center justify-between p-4 rounded-xl bg-background border border-border/50 hover:border-primary/50 transition-colors group">
            <span className="text-sm font-medium">Draft Discharge Note</span>
            <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
