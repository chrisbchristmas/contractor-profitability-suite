import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PullToRefresh from "@/components/ui/PullToRefresh";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import StatCard from "@/components/dashboard/StatCard";
import LeakageSummary from "@/components/dashboard/LeakageSummary";
import JobCard from "@/components/jobs/JobCard";
import { Briefcase, DollarSign, AlertTriangle, TrendingUp, Plus, ArrowRight, Calculator, Clock } from "lucide-react";
import JobsAtRiskWidget from "@/components/dashboard/JobsAtRiskWidget";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ProfitPaceCard from "@/components/dashboard/ProfitPaceCard";
import ProfitAtRiskCard from "@/components/dashboard/ProfitAtRiskCard";
import CashFlowCard from "@/components/dashboard/CashFlowCard";
import { calculateJobMargins, calculateProfitAtRisk, calculateUpcomingCollections, calculateContractorPerformance } from "@/components/changeorders/CalculationEngine";
import ContractorPerformanceBar from "@/components/dashboard/ContractorPerformanceBar";
import MostProfitableJobs from "@/components/dashboard/MostProfitableJobs";
import ProfitForecastWidget from "@/components/dashboard/ProfitForecastWidget";

export default function Dashboard() {
  const [currentUser, setCurrentUser] = React.useState(null);
  React.useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading: jobsLoading, refetch: refetchJobs } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list("-created_date"),
  });
  const { data: changeOrders = [], isLoading: cosLoading, refetch: refetchCOs } = useQuery({
    queryKey: ["changeOrders"],
    queryFn: () => base44.entities.ChangeOrder.list("-created_date"),
  });
  const { data: leakageFlags = [], refetch: refetchFlags } = useQuery({
    queryKey: ["leakageFlags"],
    queryFn: () => base44.entities.LeakageFlag.list("-created_date"),
  });
  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => base44.entities.Invoice.list("-created_date"),
  });

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchJobs(), refetchCOs(), refetchFlags()]);
  }, [refetchJobs, refetchCOs, refetchFlags]);

  const isLoading = jobsLoading || cosLoading;

  const activeJobs = jobs.filter(j => j.status === "active");
  const approvedCOs = changeOrders.filter(co => co.status === "approved");
  const totalFinalPrice = approvedCOs.reduce((s, co) => s + (co.final_price_to_client || co.sell_price || 0), 0);
  const totalCost = approvedCOs.reduce((s, co) => s + (co.total_cost || 0), 0);
  const now = new Date();
  const thisMonthLeakage = changeOrders
    .filter(co => { const d = new Date(co.created_date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
    .reduce((s, co) => s + (co.leakage_amount || 0), 0);
  const avgMargin = totalFinalPrice > 0
    ? ((totalFinalPrice - totalCost) / totalFinalPrice * 100).toFixed(1)
    : "0.0";

  // Enrich jobs with totalJobProfit for profit pace
  const enrichedJobs = jobs.map(job => {
    const jobCOs = changeOrders.filter(co => co.job_id === job.id);
    const { totalJobProfit } = calculateJobMargins(job, jobCOs);
    return { ...job, _totalJobProfit: totalJobProfit };
  });

  const profitAtRisk = calculateProfitAtRisk(changeOrders, currentUser?.target_margin_percent ?? 30);
  const upcoming14Days = calculateUpcomingCollections(changeOrders, 14);

  // AR Summary
  const arInvoices = invoices.filter(i => i.status === "sent" || i.status === "overdue");
  const totalOutstandingAR = arInvoices.reduce((s, i) => s + (i.total_amount || 0), 0);
  const overdueInvoices = arInvoices.filter(i => {
    if (!i.sent_date) return false;
    return Math.floor((now - new Date(i.sent_date)) / (1000 * 60 * 60 * 24)) > 30;
  });
  const oldestUnpaid = arInvoices.reduce((oldest, inv) => {
    if (!inv.sent_date) return oldest;
    const days = Math.floor((now - new Date(inv.sent_date)) / (1000 * 60 * 60 * 24));
    return days > (oldest || 0) ? days : oldest;
  }, 0);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your jobs and change orders</p>
        </div>
        <Link to={createPageUrl("Jobs")}>
          <Button className="mt-3 sm:mt-0 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-1.5" /> New Job
          </Button>
        </Link>
      </div>

      {/* Contractor Performance Summary */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-[72px] rounded-xl" />)}
        </div>
      ) : (
        <ContractorPerformanceBar jobs={jobs} changeOrders={changeOrders} />
      )}

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-[100px] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="Active Jobs"
            value={activeJobs.length}
            subtitle={`${jobs.length} total`}
            icon={Briefcase}
          />
          <StatCard
            label="Total CO Profit"
            value={`$${(totalFinalPrice - totalCost).toLocaleString(undefined, {minimumFractionDigits: 0})}`}
            subtitle={`${approvedCOs.length} approved COs`}
            icon={DollarSign}
          />
          <StatCard
            label="Avg. Margin %"
            value={`${avgMargin}%`}
            icon={TrendingUp}
            trend={parseFloat(avgMargin) >= 30 ? "On target" : "Below target"}
            trendUp={parseFloat(avgMargin) >= 30}
          />
          <StatCard
            label="Leakage Detected"
            value={`$${thisMonthLeakage.toLocaleString(undefined, {minimumFractionDigits: 0})}`}
            subtitle={thisMonthLeakage > 0 ? "Revenue at risk this month" : "No leakage this month"}
            icon={AlertTriangle}
            trendUp={thisMonthLeakage === 0}
            trend={thisMonthLeakage === 0 ? "All margins protected" : "Action needed"}
          />
        </div>
      )}

      {/* AR Summary */}
      {!isLoading && arInvoices.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-amber-500" /><p className="text-xs text-muted-foreground">Total Outstanding AR</p></div>
            <p className="text-xl font-bold text-amber-600">${totalOutstandingAR.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-1"><AlertTriangle className="h-4 w-4 text-red-500" /><p className="text-xs text-muted-foreground">Overdue Invoices</p></div>
            <p className="text-xl font-bold text-red-600">{overdueInvoices.length}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-1"><Clock className="h-4 w-4 text-slate-400" /><p className="text-xs text-muted-foreground">Oldest Unpaid</p></div>
            <p className="text-xl font-bold text-foreground">{oldestUnpaid}d</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Recent jobs */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Recent Jobs</h2>
            <Link to={createPageUrl("Jobs")} className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-[140px] rounded-xl" />)}
            </div>
          ) : activeJobs.length === 0 ? (
            <div className="bg-card rounded-xl border border-dashed border-border p-10 text-center">
              <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No active jobs yet</p>
              <Link to={createPageUrl("Jobs")}>
                <Button variant="outline" className="mt-3" size="sm">Create your first job</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeJobs.slice(0, 4).map(job => (
                <JobCard key={job.id} job={job} changeOrders={changeOrders} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          <JobsAtRiskWidget jobs={jobs} />
          <LeakageSummary leakageFlags={leakageFlags} changeOrders={changeOrders} />
          <ProfitPaceCard jobs={enrichedJobs} user={currentUser} />
          <ProfitAtRiskCard profitAtRisk={profitAtRisk} />
          <CashFlowCard upcoming14Days={upcoming14Days} />
          <MostProfitableJobs jobs={jobs} />
          <ProfitForecastWidget jobs={jobs} />
          <Link to={createPageUrl("CalculatorHub")} className="block">
            <div className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-4 flex items-center gap-3 transition-colors cursor-pointer">
              <Calculator className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Calculator Hub</p>
                <p className="text-blue-200 text-xs">10 free tools for contractors</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto flex-shrink-0" />
            </div>
          </Link>
        </div>
      </div>
    </div>
    </PullToRefresh>
  );
}