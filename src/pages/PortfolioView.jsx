import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { calculateJobMargins } from "@/components/changeorders/CalculationEngine";
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PortfolioView() {
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list("-created_date"),
  });
  const { data: changeOrders = [], isLoading: cosLoading } = useQuery({
    queryKey: ["changeOrders"],
    queryFn: () => base44.entities.ChangeOrder.list("-created_date"),
  });
  const { data: leakageFlags = [] } = useQuery({
    queryKey: ["leakageFlags"],
    queryFn: () => base44.entities.LeakageFlag.list(),
  });

  const isLoading = jobsLoading || cosLoading;

  const activeJobs = jobs.filter(j => j.status === "active");

  const enriched = activeJobs.map(job => {
    const jobCOs = changeOrders.filter(co => co.job_id === job.id);
    const margins = calculateJobMargins(job, jobCOs);
    const jobFlagCount = leakageFlags.filter(f => jobCOs.some(co => co.id === f.change_order_id)).length;
    const jobLeakage = jobCOs.reduce((s, co) => s + (co.leakage_amount || 0), 0);
    const lastActivity = jobCOs.length > 0
      ? jobCOs.reduce((latest, co) => {
          const d = new Date(co.updated_date || co.created_date);
          return d > latest ? d : latest;
        }, new Date(0))
      : new Date(job.updated_date || job.created_date);
    const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    // Profit pace: compare actual margin to target
    const targetMargin = job.target_margin_percent || 20;
    const actualMargin = margins.realTimeMargin;
    let pace = "on-track";
    if (actualMargin >= targetMargin + 3) pace = "ahead";
    else if (actualMargin < targetMargin - 2) pace = "behind";

    return {
      ...job,
      margins,
      flagCount: jobFlagCount,
      leakage: jobLeakage,
      daysSinceActivity,
      pace,
      actualMargin,
    };
  });

  // Sort by most at-risk: lowest margin with leakage flags at top
  const sorted = [...enriched].sort((a, b) => {
    const aRisk = (a.flagCount > 0 ? 1000 : 0) + (100 - a.actualMargin);
    const bRisk = (b.flagCount > 0 ? 1000 : 0) + (100 - b.actualMargin);
    return bRisk - aRisk;
  });

  // Summary
  const totalContractValue = enriched.reduce((s, j) => s + (j.contract_value || 0), 0);
  const totalWeightedMargin = enriched.length > 0
    ? enriched.reduce((s, j) => s + (j.actualMargin * (j.contract_value || 0)), 0) / (totalContractValue || 1)
    : 0;
  const totalFlaggedCOs = enriched.reduce((s, j) => s + j.flagCount, 0);
  const totalLeakage = enriched.reduce((s, j) => s + j.leakage, 0);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Portfolio View</h1>
        <p className="text-sm text-muted-foreground mt-1">All active jobs at a glance — sorted by most at-risk first.</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <SummaryStat label="Total Active Contract Value" value={`$${totalContractValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
        <SummaryStat label="Weighted Avg Margin" value={`${totalWeightedMargin.toFixed(1)}%`}
          tone={totalWeightedMargin > 20 ? "green" : totalWeightedMargin >= 10 ? "yellow" : "red"} />
        <SummaryStat label="Total Flagged COs" value={totalFlaggedCOs} tone={totalFlaggedCOs > 0 ? "red" : "neutral"} />
        <SummaryStat label="Total Detected Leakage" value={`$${totalLeakage.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} tone={totalLeakage > 0 ? "red" : "neutral"} />
      </div>

      {/* Job list */}
      {sorted.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No active jobs in your portfolio.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map(job => (
            <PortfolioJobRow key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}

function PortfolioJobRow({ job }) {
  const margin = job.actualMargin;
  const marginTone = margin > 20 ? "green" : margin >= 10 ? "yellow" : "red";

  const paceConfig = {
    "ahead": { label: "Ahead", icon: TrendingUp, className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    "on-track": { label: "On Track", icon: Minus, className: "bg-blue-50 text-blue-700 border-blue-200" },
    "behind": { label: "Behind", icon: TrendingDown, className: "bg-red-50 text-red-700 border-red-200" },
  };
  const pace = paceConfig[job.pace];
  const PaceIcon = pace.icon;

  return (
    <Link to={`${createPageUrl("JobDetail")}?id=${job.id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Job name + client */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-slate-900 truncate">{job.job_name}</h3>
                {job.flagCount > 0 && (
                  <Badge variant="outline" className="shrink-0 bg-red-50 text-red-700 border-red-200 gap-1">
                    <Flag className="h-3 w-3" /> {job.flagCount}
                  </Badge>
                )}
              </div>
              {job.client_name && <p className="text-xs text-slate-500 mt-0.5">{job.client_name}</p>}
            </div>

            {/* Contract value */}
            <div className="sm:w-32 text-left sm:text-right">
              <p className="text-xs text-slate-400">Contract</p>
              <p className="text-sm font-semibold text-slate-900">${(job.contract_value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>

            {/* Margin */}
            <div className="sm:w-28 text-left sm:text-right">
              <p className="text-xs text-slate-400">Proj. Margin</p>
              <p className={cn("text-sm font-bold",
                marginTone === "green" ? "text-emerald-600" :
                marginTone === "yellow" ? "text-amber-600" : "text-red-600"
              )}>
                {margin.toFixed(1)}%
              </p>
            </div>

            {/* Days since activity */}
            <div className="sm:w-28 text-left sm:text-right">
              <p className="text-xs text-slate-400">Last Activity</p>
              <p className="text-sm font-medium text-slate-600">
                {job.daysSinceActivity === 0 ? "Today" : `${job.daysSinceActivity}d ago`}
              </p>
            </div>

            {/* Pace */}
            <div className="sm:w-28">
              <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border", pace.className)}>
                <PaceIcon className="h-3 w-3" /> {pace.label}
              </span>
            </div>

            {/* Leakage */}
            <div className="sm:w-24 text-left sm:text-right">
              <p className="text-xs text-slate-400">Leakage</p>
              {job.leakage > 0 ? (
                <p className="text-sm font-semibold text-red-600 flex items-center gap-1 sm:justify-end">
                  <AlertTriangle className="h-3 w-3" />
                  ${job.leakage.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              ) : (
                <p className="text-sm font-medium text-slate-400">—</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function SummaryStat({ label, value, tone = "neutral" }) {
  const toneClass = tone === "green" ? "text-emerald-600" : tone === "yellow" ? "text-amber-600" : tone === "red" ? "text-red-600" : "text-slate-900";
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className={cn("text-xl font-bold", toneClass)}>{value}</p>
      </CardContent>
    </Card>
  );
}