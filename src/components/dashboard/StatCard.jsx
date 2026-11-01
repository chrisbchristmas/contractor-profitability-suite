import React from "react";
import { cn } from "@/lib/utils";

export default function StatCard({ label, value, subtitle, icon: Icon, trend, trendUp, className }) {
  return (
    <div className={cn("bg-white rounded-xl border border-slate-200 p-3 sm:p-5 hover:shadow-md transition-shadow duration-200", className)}>
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500" />
          </div>
        )}
      </div>
      <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
      <div className="flex items-center gap-2 mt-1.5">
        {trend && (
          <span className={cn(
            "text-xs font-medium px-1.5 py-0.5 rounded",
            trendUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          )}>
            {trend}
          </span>
        )}
        {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
      </div>
    </div>
  );
}