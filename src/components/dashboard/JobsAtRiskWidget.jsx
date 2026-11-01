import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { AlertTriangle, ArrowRight, CheckCircle } from "lucide-react";

export default function JobsAtRiskWidget({ jobs = [] }) {
  const atRisk = jobs.filter(j => j.profit_alerts && j.profit_alerts.trim() !== "");

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Jobs at Risk
        </h3>
        <Link to={createPageUrl("ProfitAlerts")} className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {atRisk.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-emerald-600 py-2">
          <CheckCircle className="w-4 h-4" />
          No profit alerts detected
        </div>
      ) : (
        <div className="space-y-2">
          {atRisk.slice(0, 4).map(job => {
            const alerts = job.profit_alerts.split(",").map(a => a.trim()).filter(Boolean);
            return (
              <Link key={job.id} to={`${createPageUrl("JobDetail")}?id=${job.id}`} className="block">
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 hover:bg-red-100 transition-colors">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{job.job_name}</p>
                    <p className="text-xs text-red-600 truncate">{alerts[0]}{alerts.length > 1 ? ` +${alerts.length - 1} more` : ""}</p>
                  </div>
                  {job.true_margin_percent != null && (
                    <span className="ml-auto text-xs font-bold text-red-600 flex-shrink-0">
                      {job.true_margin_percent.toFixed(1)}%
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}