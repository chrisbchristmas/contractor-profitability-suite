import React from "react";
import { Trophy } from "lucide-react";
import { rankJobsByProfitability } from "@/components/changeorders/CalculationEngine";
import { cn } from "@/lib/utils";

const fmt = (n) => `$${(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function MostProfitableJobs({ jobs }) {
  const ranked = rankJobsByProfitability(jobs).slice(0, 5);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Most Profitable Jobs</h3>
      </div>
      {ranked.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">No job data yet</p>
      ) : (
        <div className="space-y-2">
          {ranked.map((job, i) => {
            const m = job._metrics;
            return (
              <div key={job.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <span className={cn("text-xs font-bold w-5 text-center", i === 0 ? "text-amber-500" : "text-slate-400")}>
                  #{i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{job.job_name}</p>
                  <p className="text-xs text-slate-400">{m.marginPercent.toFixed(1)}% margin</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-600">{fmt(m.profit)}</p>
                  <p className="text-xs text-slate-400">{fmt(m.profitPerHour)}/hr</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}