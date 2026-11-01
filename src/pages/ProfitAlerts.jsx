import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, RefreshCw, CheckCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

function fmt(n) { return `${(n || 0).toFixed(1)}%`; }

export default function ProfitAlerts() {
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState({});

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list("-created_date"),
  });

  const jobsWithAlerts = jobs.filter(j => j.profit_alerts && j.profit_alerts.trim() !== "");
  const jobsClean = jobs.filter(j => !j.profit_alerts || j.profit_alerts.trim() === "");

  const runAll = async () => {
    setRunning(true);
    const res = {};
    for (const job of jobs) {
      try {
        const r = await base44.functions.invoke("checkProfitLeakage", { job_id: job.id });
        res[job.id] = r.data;
      } catch {
        res[job.id] = { error: true };
      }
    }
    setResults(res);
    setRunning(false);
    queryClient.invalidateQueries({ queryKey: ["jobs"] });
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Profit Alerts</h1>
          <p className="text-sm text-muted-foreground mt-1">Jobs where profit is being lost or at risk</p>
        </div>
        <Button className="mt-3 sm:mt-0 bg-blue-600 hover:bg-blue-700" onClick={runAll} disabled={running || jobs.length === 0}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${running ? "animate-spin" : ""}`} />
          {running ? "Scanning..." : "Scan All Jobs"}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <SummaryCard label="Total Jobs" value={jobs.length} color="text-slate-900" />
        <SummaryCard label="At Risk" value={jobsWithAlerts.length} color="text-red-600" />
        <SummaryCard label="Healthy" value={jobsClean.length} color="text-emerald-600" />
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : jobsWithAlerts.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border p-16 text-center">
          <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-foreground font-semibold">No profit alerts detected</p>
          <p className="text-muted-foreground text-sm mt-1">Click "Scan All Jobs" to check all jobs for leakage</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Jobs With Profit Risk</p>
          {jobsWithAlerts.map(job => (
            <AlertRow key={job.id} job={job} />
          ))}
        </div>
      )}

      {jobsClean.length > 0 && jobsWithAlerts.length > 0 && (
        <div className="mt-8 space-y-3">
          <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wider mb-3">Healthy Jobs</p>
          {jobsClean.slice(0, 5).map(job => (
            <div key={job.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">{job.job_name}</p>
                  <p className="text-xs text-muted-foreground">{job.client_name || "—"}</p>
                </div>
              </div>
              {job.true_margin_percent != null && (
                <span className="text-sm font-semibold text-emerald-600">{fmt(job.true_margin_percent)} margin</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AlertRow({ job }) {
  const alerts = job.profit_alerts ? job.profit_alerts.split(",").map(a => a.trim()).filter(Boolean) : [];
  return (
    <Link to={`${createPageUrl("JobDetail")}?id=${job.id}`} className="block">
      <div className="bg-white rounded-xl border border-red-200 p-4 hover:border-red-300 hover:shadow-sm transition-all">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-slate-900">{job.job_name}</p>
              <p className="text-xs text-slate-400">{job.client_name || "—"} · ${(job.contract_price || 0).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {job.true_margin_percent != null && (
              <span className={`text-sm font-bold ${job.true_margin_percent < (job.target_margin_percent || 20) ? "text-red-600" : "text-slate-700"}`}>
                {fmt(job.true_margin_percent)}
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 ml-8">
          {alerts.map(a => (
            <span key={a} className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">{a}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}