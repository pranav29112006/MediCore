import { useState } from "react";
import { motion } from "motion/react";
import {
  Users, Activity, AlertTriangle, ShieldCheck, BedDouble,
  TrendingUp, Heart, ChevronRight, BarChart3,
  Building2, Stethoscope,
} from "lucide-react";
import {
  getHospitalStats, getRiskDistribution, getDepartmentStats,
  getWardOccupancy, getAlerts, getActivePatients,
} from "../../lib/data-service";

const RISK_COLORS: Record<string, string> = {
  critical: "#ef4444", high: "#f43f5e", medium: "#f59e0b", low: "#10b981",
};
const RISK_DOT: Record<string, string> = {
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

export function AdminDashboard() {
  const stats = getHospitalStats();
  const riskDist = getRiskDistribution();
  const departments = getDepartmentStats();
  const wardOccupancy = getWardOccupancy();
  const alerts = getAlerts({ acknowledged: false });
  const activePatients = getActivePatients();

  const totalRisk = riskDist.critical + riskDist.high + riskDist.medium + riskDist.low;

  const mainStats = [
    { label: "Total Patients", value: stats.totalPatients.toLocaleString(), icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", sub: `${stats.admittedToday} admitted today` },
    { label: "Active Staff", value: "142", icon: Stethoscope, color: "text-emerald-500", bg: "bg-emerald-500/10", sub: "Across all departments" },
    { label: "Active Alerts", value: stats.activeAlerts, icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10", sub: `${alerts.filter(a => a.severity === "critical").length} critical` },
    { label: "Occupancy Rate", value: `${stats.occupancyRate}%`, icon: BedDouble, color: "text-indigo-500", bg: "bg-indigo-500/10", sub: `${stats.totalWards} wards active` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">System Overview</h2>
        <p className="text-muted-foreground text-sm">Hospital-wide metrics, risk analytics, and departmental performance.</p>
      </motion.div>

      {/* Main Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainStats.map((stat, i) => (
          <motion.div key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
            className="p-5 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm flex flex-col gap-3 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <stat.icon className={`size-5 ${stat.color}`} />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm flex flex-col gap-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <BarChart3 className="size-5 text-primary" /> Risk Distribution
          </h3>

          {/* Visual Bar */}
          <div className="h-6 rounded-full overflow-hidden flex bg-muted">
            {(["critical", "high", "medium", "low"] as const).map(level => {
              const pct = totalRisk > 0 ? (riskDist[level] / totalRisk) * 100 : 0;
              return pct > 0 ? (
                <div key={level} style={{ width: `${pct}%`, backgroundColor: RISK_COLORS[level] }}
                  className="h-full transition-all relative group">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {pct > 8 && <span className="text-[10px] font-bold text-white">{Math.round(pct)}%</span>}
                  </div>
                </div>
              ) : null;
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(["critical", "high", "medium", "low"] as const).map(level => (
              <div key={level} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-background/50">
                <div className={`size-3 rounded-full ${RISK_DOT[level]}`} />
                <div>
                  <p className="text-lg font-bold">{riskDist[level]}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{level} Risk</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Department Performance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm flex flex-col gap-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Building2 className="size-5 text-primary" /> Department Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-2.5 rounded-l-lg">Department</th>
                  <th className="px-4 py-2.5">Admitted</th>
                  <th className="px-4 py-2.5">High/Critical</th>
                  <th className="px-4 py-2.5">Occupancy</th>
                  <th className="px-4 py-2.5 rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d) => (
                  <tr key={d.wardId} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{d.department}</td>
                    <td className="px-4 py-3">{d.admitted}</td>
                    <td className="px-4 py-3">
                      {d.critical > 0 ? (
                        <span className="text-rose-500 font-semibold">{d.critical}</span>
                      ) : (
                        <span className="text-emerald-500">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${d.occupancy > 90 ? "bg-rose-500" : d.occupancy > 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${d.occupancy}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{d.occupancy}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${d.occupancy > 90 ? "bg-rose-500/10 text-rose-500" : d.occupancy > 70 ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                        {d.occupancy > 90 ? "Near Full" : d.occupancy > 70 ? "Moderate" : "Available"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" /> Active Alerts
            </h3>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-500">
              {alerts.length} unread
            </span>
          </div>
          <div className="flex flex-col gap-2.5 max-h-[350px] overflow-y-auto">
            {alerts.slice(0, 10).map((a) => (
              <div key={a.id} className={`flex items-start gap-3 p-3 rounded-lg border ${a.severity === "critical" ? "border-red-500/30 bg-red-500/5" : "border-border/30 bg-background/50"}`}>
                <div className={`size-2 rounded-full mt-1.5 shrink-0 ${RISK_DOT[a.severity]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{a.patientName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.message}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-muted-foreground">{a.wardName} · {a.roomNumber}</span>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(a.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Ward Occupancy Grid */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm flex flex-col gap-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <BedDouble className="size-5 text-primary" /> Ward Heatmap
          </h3>
          <div className="grid grid-cols-3 gap-2.5">
            {wardOccupancy.map((w) => (
              <div key={w.name}
                className={`p-3 rounded-lg border transition-colors ${w.percent > 90 ? "border-rose-500/30 bg-rose-500/10" : w.percent > 70 ? "border-amber-500/20 bg-amber-500/5" : "border-border/30 bg-background/50"}`}>
                <p className="text-[10px] text-muted-foreground font-semibold truncate">{w.name}</p>
                <p className={`text-lg font-bold mt-0.5 ${w.percent > 90 ? "text-rose-500" : w.percent > 70 ? "text-amber-500" : "text-emerald-500"}`}>
                  {w.percent}%
                </p>
                <p className="text-[10px] text-muted-foreground">{w.occupied}/{w.total}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Key Metrics Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <TrendingUp className="size-5 text-primary" /> Key Metrics Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "ICU Occupancy", value: `${stats.icuPatients}`, sub: "patients in ICU", color: "text-rose-500" },
            { label: "High Risk Patients", value: `${stats.highRiskPatients}`, sub: "require close monitoring", color: "text-amber-500" },
            { label: "Avg Occupancy", value: `${stats.occupancyRate}%`, sub: "across all wards", color: "text-blue-500" },
            { label: "Discharged Today", value: `${stats.dischargedToday}`, sub: "successfully discharged", color: "text-emerald-500" },
          ].map((m) => (
            <div key={m.label} className="p-4 rounded-xl bg-background/50 border border-border/30">
              <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-sm font-medium mt-1">{m.label}</p>
              <p className="text-[10px] text-muted-foreground">{m.sub}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
