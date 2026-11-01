import React from "react";
import { DollarSign, TrendingUp, Briefcase, AlertTriangle } from "lucide-react";
import { calculateContractorPerformance } from "@/components/changeorders/CalculationEngine";

const fmt = (n) => `$${(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function ContractorPerformanceBar({ jobs, changeOrders }) {
  const perf = calculateContractorPerformance(jobs, changeOrders);

  const metrics = [
    { label: "Total Revenue", value: fmt(perf.totalRevenue), icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Profit", value: fmt(perf.totalProfit), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Avg Margin", value: `${perf.avgMargin.toFixed(1)}%`, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Active Jobs", value: perf.activeJobCount, icon: Briefcase, color: "text-slate-600", bg: "bg-slate-100" },
    { label: "Jobs At Risk", value: perf.jobsAtRiskCount, icon: AlertTriangle, color: perf.jobsAtRiskCount > 0 ? "text-red-600" : "text-slate-400", bg: perf.jobsAtRiskCount > 0 ? "bg-red-50" : "bg-slate-50" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {metrics.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className={`h-9 w-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 truncate">{label}</p>
            <p className={`text-base font-bold ${color} truncate`}>{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}