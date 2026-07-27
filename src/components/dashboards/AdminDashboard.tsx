import { motion } from "motion/react";
import { Users, Activity, AlertTriangle, ShieldCheck } from "lucide-react";

export function AdminDashboard() {
  const stats = [
    { label: "Total Patients", value: "1,284", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Active Staff", value: "142", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "System Alerts", value: "3", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Compliance Score", value: "98%", icon: ShieldCheck, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">System Overview</h2>
        <p className="text-muted-foreground text-sm">Hospital-wide metrics and administrative controls.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="p-5 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm flex flex-col gap-3 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <stat.icon className={`size-5 ${stat.color}`} />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm h-80 flex items-center justify-center"
        >
          <p className="text-muted-foreground">Analytics Chart Placeholder</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm flex flex-col gap-4"
        >
          <h3 className="font-semibold text-lg">Recent Audit Logs</h3>
          <div className="flex-1 flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/30">
                <ShieldCheck className="size-4 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">User Role Updated</p>
                  <p className="text-xs text-muted-foreground">Admin changed Dr. Smith's access level.</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
