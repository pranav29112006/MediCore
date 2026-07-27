import { motion } from "motion/react";
import { UserPlus, CalendarDays, BedDouble, Search } from "lucide-react";

export function ReceptionistDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Front Desk</h2>
        <p className="text-muted-foreground text-sm">Patient registration and admissions.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Register Patient", icon: UserPlus, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Admissions Today", icon: CalendarDays, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Bed Availability", icon: BedDouble, color: "text-indigo-500", bg: "bg-indigo-500/10" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="p-5 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm flex flex-col items-center justify-center gap-3 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer"
          >
            <div className={`p-4 rounded-full ${item.bg}`}>
              <item.icon className={`size-6 ${item.color}`} />
            </div>
            <span className="font-semibold">{item.label}</span>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-4 p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Patient Search</h3>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 size-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by name, ID, or phone number..." 
            className="w-full pl-11 pr-4 py-3 bg-background border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        <div className="mt-4 text-center py-10 border-2 border-dashed border-border/50 rounded-xl">
          <p className="text-muted-foreground text-sm">Enter a search query to find patient records.</p>
        </div>
      </motion.div>
    </div>
  );
}
