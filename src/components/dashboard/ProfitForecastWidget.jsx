import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { calculateProfitForecast, calculateJobDirectMetrics } from "@/components/changeorders/CalculationEngine";
import { cn } from "@/lib/utils";

const fmt = (n) => `$${(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function ProfitForecastWidget({ jobs }) {
  const activeJobs = jobs.filter(j => (j.status || j.job_status) === "active" && j.estimated_remaining_costs > 0);
  if (activeJobs.length === 0) return null;

  const forecasts = activeJobs.map(job => ({
    job,
    current: calculateJobDirectMetrics(job),
    forecast: calculateProfitForecast(job),
  }));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Profit Forecast</h3>
      <div className="space-y-3">
        {forecasts.map(({ job, current, forecast }) => {
          const delta = forecast.projectedMargin - current.marginPercent;
          const isDown = delta < 0;
          return (
            <div key={job.id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{job.job_name}</p>
                <p className="text-xs text-slate-400">Current: {current.marginPercent.toFixed(1)}%</p>
              </div>
              <div className="text-right flex items-center gap-1.5">
                {isDown ? <TrendingDown className="h-3.5 w-3.5 text-red-500" /> : <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
                <div>
                  <p className={cn("text-sm font-semibold", isDown ? "text-red-600" : "text-emerald-600")}>
                    {forecast.projectedMargin.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-400">{fmt(forecast.projectedProfit)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}