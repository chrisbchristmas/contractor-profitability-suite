import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, TrendingDown, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateJobMargins } from "@/components/changeorders/CalculationEngine";
import SaveJobTemplateDialog from "@/components/jobs/SaveJobTemplateDialog";

const statusStyles = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function JobCard({ job, changeOrders = [] }) {
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const jobCOs = changeOrders.filter(co => co.job_id === job.id);
  const margins = calculateJobMargins(job, jobCOs);
  const totalLeakage = jobCOs.reduce((s, co) => s + (co.leakage_amount || 0), 0);

  return (
    <>
    <Link
      to={createPageUrl("JobDetail") + `?id=${job.id}`}
      className="group block bg-white rounded-xl border border-slate-200 p-3 sm:p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
            {job.job_name}
          </h3>
          {job.client_name && (
            <p className="text-sm text-slate-400 mt-0.5">{job.client_name}</p>
          )}
        </div>
        <Badge variant="outline" className={cn("text-xs shrink-0 ml-2", statusStyles[job.status] || "bg-slate-50 text-slate-500")}>
          {job.status}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <div>
          <p className="text-xs text-slate-400">Contract</p>
          <p className="text-sm font-semibold text-slate-900">${job.contract_value?.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Adj. Revenue</p>
          <p className="text-sm font-semibold text-slate-900">${margins.adjustedRevenue?.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Real Margin</p>
          <div className="flex items-center gap-1">
            {margins.realTimeMargin >= (job.target_margin_percent || 30) ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            )}
            <p className={cn(
              "text-sm font-semibold",
              margins.realTimeMargin >= (job.target_margin_percent || 30) ? "text-emerald-600" : "text-red-600"
            )}>
              {margins.realTimeMargin.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {totalLeakage > 0 && (
        <div className="mt-3 px-3 py-2 bg-red-50 rounded-lg flex items-center justify-between">
          <span className="text-xs font-medium text-red-600">CO Leakage</span>
          <span className="text-xs font-bold text-red-700">${totalLeakage.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowSaveTemplate(true); }}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 transition-colors"
        >
          <Bookmark className="h-3.5 w-3.5" /> Save as Template
        </button>
        <div className="flex items-center text-xs text-slate-400 group-hover:text-blue-500 transition-colors">
          View details <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </div>
      </div>
    </Link>
    {showSaveTemplate && (
      <SaveJobTemplateDialog job={job} open={showSaveTemplate} onClose={() => setShowSaveTemplate(false)} />
    )}
    </>
  );
}