import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, Briefcase, CheckCircle, Lock, Send, FileDown, Bookmark, AlertTriangle, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ChangeOrderForm from "@/components/changeorders/ChangeOrderForm";
import ChangeOrderCard from "@/components/changeorders/ChangeOrderCard";
import { logAudit } from "@/components/auth/AuditLogger";
import { calculateJobMargins, calculateProjectedJobMargin } from "@/components/changeorders/CalculationEngine";
import {
  canCreateCO, canDeleteCO, canEditCO, canApproveCO,
  canViewFinancials, isOwner
} from "@/components/auth/permissions";
import JobRiskBadge from "@/components/jobs/JobRiskBadge";
import JobAttachments from "@/components/jobs/JobAttachments";
import JobPurchaseOrders from "@/components/jobs/JobPurchaseOrders";
import JobWarranties from "@/components/jobs/JobWarranties";
import ClientPortalPanel from "@/components/jobs/ClientPortalPanel";
import JobProfitReport from "@/components/jobs/JobProfitReport";
import JobCloseoutScorecard from "@/components/jobs/JobCloseoutScorecard";
import JobInvoices from "@/components/jobs/JobInvoices";
import SaveJobTemplateDialog from "@/components/jobs/SaveJobTemplateDialog";
import JobDailyLogs from "@/components/jobs/JobDailyLogs";
import JobTasks from "@/components/jobs/JobTasks";
import JobSelections from "@/components/jobs/JobSelections";
import JobLienWaivers from "@/components/jobs/JobLienWaivers";
import JobCrewCosts from "@/components/jobs/JobCrewCosts";
import JobExpenses from "@/components/jobs/JobExpenses";
import JobVariancePanel from "@/components/jobs/JobVariancePanel";


export default function JobDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get("id");
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingCO, setEditingCO] = useState(null);
  const [deletingCO, setDeletingCO] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showDeleteJob, setShowDeleteJob] = useState(false);
  const [coStatusFilter, setCoStatusFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => base44.entities.Job.filter({ id: jobId }),
    select: (data) => data?.[0],
    enabled: !!jobId,
  });

  const { data: changeOrders = [], isLoading: cosLoading } = useQuery({
    queryKey: ["changeOrders", jobId],
    queryFn: () => base44.entities.ChangeOrder.filter({ job_id: jobId }, "-created_date"),
    enabled: !!jobId,
  });

  const { data: presets = [] } = useQuery({
    queryKey: ["presets"],
    queryFn: () => base44.entities.CostPreset.list(),
  });

  const { data: lienWaivers = [] } = useQuery({
    queryKey: ["lienWaivers", jobId],
    queryFn: () => base44.entities.LienWaiver.filter({ job_id: jobId }),
    enabled: !!jobId,
  });
  const { data: timeEntries = [] } = useQuery({
    queryKey: ["timeEntries", jobId],
    queryFn: () => base44.entities.TimeEntry.filter({ job_id: jobId }),
    enabled: !!jobId,
  });
  const { data: crewCosts = [] } = useQuery({
    queryKey: ["crewCosts", jobId],
    queryFn: () => base44.entities.CrewCost.filter({ job_id: jobId }),
    enabled: !!jobId,
  });
  const { data: jobExpenses = [] } = useQuery({
    queryKey: ["jobExpenses", jobId],
    queryFn: () => base44.entities.JobExpense.filter({ job_id: jobId }),
    enabled: !!jobId,
  });

  // Keep variance / profit alerts fresh on load
  useEffect(() => {
    if (!jobId) return;
    base44.functions.invoke("checkProfitLeakage", { job_id: jobId })
      .then(() => queryClient.invalidateQueries({ queryKey: ["jobs"] }))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);
  const hasOutstandingWaivers = lienWaivers.some(w => w.status === "Pending");
  const showLienWarning = hasOutstandingWaivers && (job?.pipeline_status === "Complete" || job?.pipeline_status === "Invoiced");

  const createCOMutation = useMutation({
    mutationFn: async ({ coData, flags }) => {
      const created = await base44.entities.ChangeOrder.create({ ...coData, job_id: jobId });
      if (flags?.length > 0) {
        await base44.entities.LeakageFlag.bulkCreate(
          flags.map(f => ({ ...f, change_order_id: created.id }))
        );
      }
      await logAudit({ recordType: "ChangeOrder", recordId: created.id, action: "create", user: currentUser, description: `Created CO: ${coData.description}` });
      return created;
    },
    onMutate: async ({ coData }) => {
      await queryClient.cancelQueries({ queryKey: ["changeOrders", jobId] });
      const previous = queryClient.getQueryData(["changeOrders", jobId]);
      const optimistic = { ...coData, id: `temp-${Date.now()}`, job_id: jobId, created_date: new Date().toISOString() };
      queryClient.setQueryData(["changeOrders", jobId], (old = []) => [optimistic, ...old]);
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["changeOrders", jobId], ctx.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["changeOrders", jobId] });
      queryClient.invalidateQueries({ queryKey: ["leakageFlags"] });
      setShowForm(false);
    },
  });

  const updateCOMutation = useMutation({
    mutationFn: async ({ id, coData, flags, oldStatus }) => {
      // Prevent PM from approving
      if (coData.status === "approved" && !canApproveCO(currentUser)) {
        throw new Error("Only Owner can approve change orders.");
      }
      await base44.entities.ChangeOrder.update(id, coData);
      // Refresh leakage flags
      const oldFlags = await base44.entities.LeakageFlag.filter({ change_order_id: id });
      for (const f of oldFlags) await base44.entities.LeakageFlag.delete(f.id);
      if (flags?.length > 0) {
        await base44.entities.LeakageFlag.bulkCreate(
          flags.map(f => ({ ...f, change_order_id: id }))
        );
      }
      // Stamp approval
      if (coData.status === "approved" && oldStatus !== "approved") {
        if (!isOwner(currentUser) && (coData.true_margin_percent || 0) < (coData.target_margin || 30)) {
          throw new Error("Cannot approve: margin below target. Only the Owner can override this.");
        }
        await base44.entities.ChangeOrder.update(id, {
          approved_by: currentUser?.id,
          approved_by_name: currentUser?.full_name,
          approved_at: new Date().toISOString(),
        });
        const allJobCOs = await base44.entities.ChangeOrder.filter({ job_id: coData.job_id });
        const { adjustedRevenue, adjustedCost, realTimeMargin } = calculateJobMargins(job, allJobCOs);
        await base44.entities.MarginHistory.create({
          job_id: coData.job_id,
          change_order_id: id,
          margin_percent: realTimeMargin,
          adjusted_revenue: adjustedRevenue,
          adjusted_cost: adjustedCost,
          snapshot_reason: "CO approved",
        });
      }
      await logAudit({ recordType: "ChangeOrder", recordId: id, action: "update", user: currentUser, description: `Updated CO status to ${coData.status}` });
    },
    onMutate: async ({ id, coData }) => {
      await queryClient.cancelQueries({ queryKey: ["changeOrders", jobId] });
      const previous = queryClient.getQueryData(["changeOrders", jobId]);
      queryClient.setQueryData(["changeOrders", jobId], (old = []) =>
        old.map(co => co.id === id ? { ...co, ...coData } : co)
      );
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["changeOrders", jobId], ctx.previous);
      toast.error(err.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["changeOrders", jobId] });
      queryClient.invalidateQueries({ queryKey: ["leakageFlags"] });
      setShowForm(false);
      setEditingCO(null);
    },
  });

  const deleteCOMutation = useMutation({
    mutationFn: async (co) => {
      await base44.entities.ChangeOrder.delete(co.id);
      await logAudit({ recordType: "ChangeOrder", recordId: co.id, action: "delete", user: currentUser, description: `Deleted CO: ${co.description}` });
    },
    onMutate: async (co) => {
      await queryClient.cancelQueries({ queryKey: ["changeOrders", jobId] });
      const previous = queryClient.getQueryData(["changeOrders", jobId]);
      queryClient.setQueryData(["changeOrders", jobId], (old = []) => old.filter(c => c.id !== co.id));
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["changeOrders", jobId], ctx.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["changeOrders", jobId] });
      setDeletingCO(null);
    },
  });

  const updatePhotosMutation = useMutation({
    mutationFn: async ({ id, photos }) => {
      await base44.entities.ChangeOrder.update(id, { photos });
    },
    onMutate: async ({ id, photos }) => {
      await queryClient.cancelQueries({ queryKey: ["changeOrders", jobId] });
      const previous = queryClient.getQueryData(["changeOrders", jobId]);
      queryClient.setQueryData(["changeOrders", jobId], (old = []) =>
        old.map(co => co.id === id ? { ...co, photos } : co)
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["changeOrders", jobId], ctx.previous);
      toast.error("Failed to remove photo.");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["changeOrders", jobId] }),
  });

  const handleSave = (coData, flags) => {
    if (editingCO) {
      updateCOMutation.mutate({ id: editingCO.id, coData, flags, oldStatus: editingCO.status });
    } else {
      createCOMutation.mutate({ coData, flags });
    }
  };

  const handleEdit = (co) => {
    if (!canEditCO(currentUser, co)) {
      toast.error("You don't have permission to edit this change order.");
      return;
    }
    setEditingCO(co);
    setShowForm(true);
  };

  const handleDelete = (co) => {
    if (!canDeleteCO(currentUser)) {
      toast.error("Only Owners can delete change orders.");
      return;
    }
    setDeletingCO(co);
  };

  const sendForApprovalMutation = useMutation({
    mutationFn: async (co) => {
      const res = await base44.functions.invoke("sendChangeOrderForApproval", {
        change_order_id: co.id,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["changeOrders", jobId] });
      if (data?.approval_url) {
        navigator.clipboard?.writeText(data.approval_url).catch(() => {});
        toast.success("Approval link generated and copied to clipboard!");
      } else {
        toast.success("Change order sent for approval.");
      }
    },
    onError: (err) => {
      toast.error(err?.response?.data?.error || err?.message || "Failed to send for approval.");
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async () => {
      // Fetch CO IDs first for CO-linked sub-records
      const cos = await base44.entities.ChangeOrder.filter({ job_id: jobId });
      for (const co of cos) {
        await base44.entities.LeakageFlag.deleteMany({ change_order_id: co.id });
        await base44.entities.PdfRecord.deleteMany({ change_order_id: co.id });
      }
      // Delete all job-related records
      await base44.entities.ChangeOrder.deleteMany({ job_id: jobId });
      await base44.entities.DailyLog.deleteMany({ job_id: jobId });
      await base44.entities.Task.deleteMany({ job_id: jobId });
      await base44.entities.Invoice.deleteMany({ job_id: jobId });
      await base44.entities.JobAttachment.deleteMany({ job_id: jobId });
      await base44.entities.Selection.deleteMany({ job_id: jobId });
      await base44.entities.LienWaiver.deleteMany({ job_id: jobId });
      await base44.entities.CrewCost.deleteMany({ job_id: jobId });
      await base44.entities.TimeEntry.deleteMany({ job_id: jobId });
      await base44.entities.JobExpense.deleteMany({ job_id: jobId });
      await base44.entities.SubcontractorPO.deleteMany({ job_id: jobId });
      await base44.entities.Warranty.deleteMany({ job_id: jobId });
      await base44.entities.MarginHistory.deleteMany({ job_id: jobId });
      // Finally delete the job itself
      await base44.entities.Job.delete(jobId);
      await logAudit({ recordType: "Job", recordId: jobId, action: "delete", user: currentUser, description: `Deleted job: ${job?.job_name}` });
    },
    onSuccess: () => {
      toast.success("Job deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      navigate("/Jobs");
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to delete job.");
    },
  });

  const showFinancials = canViewFinancials(currentUser);
  const targetMargin = job?.target_margin_percent ?? currentUser?.target_margin_percent ?? 30;
  const totalLeakage = changeOrders.reduce((s, co) => s + (co.leakage_amount || 0), 0);
  const jobMargins = job ? calculateJobMargins(job, changeOrders) : null;
  const pipelineStatus = job?.pipeline_status || "Active";
  const showScorecard = pipelineStatus === "Complete" || pipelineStatus === "Invoiced";

  if (jobLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[200px] rounded-xl" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto text-center py-20">
        <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">Job not found</p>
        <Link to={createPageUrl("Jobs")}>
          <Button variant="outline" className="mt-3">Back to Jobs</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <Link to={createPageUrl("Jobs")} className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Jobs
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{job.job_name}</h1>
              {jobMargins && <JobRiskBadge riskLabel={jobMargins.riskLabel} riskScore={jobMargins.riskScore} />}
            </div>
            {job.client_name && <p className="text-sm text-muted-foreground mt-0.5">{job.client_name}</p>}
          </div>
          <div className="flex gap-2 mt-3 sm:mt-0">
            {canCreateCO(currentUser) && (
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { setEditingCO(null); setShowForm(true); }}>
                <Plus className="h-4 w-4 mr-1.5" /> Add Change Order
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowSaveTemplate(true)}>
              <Bookmark className="h-4 w-4 mr-1.5" /> Save as Template
            </Button>
            <Button variant="outline" onClick={() => setShowReport(true)}>
              <FileDown className="h-4 w-4 mr-1.5" /> Generate Report
            </Button>
            <Button variant="destructive" onClick={() => setShowDeleteJob(true)}>
              <Trash2 className="h-4 w-4 mr-1.5" /> Delete Job
            </Button>
          </div>
        </div>
      </div>

      {/* Lien waiver warning */}
      {showLienWarning && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-amber-200 bg-amber-50 mb-4 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="font-medium text-amber-700">Outstanding lien waivers</span>
          <span className="text-amber-600">— this job is marked {job.pipeline_status} but has {lienWaivers.filter(w => w.status === "Pending").length} pending lien waiver(s). Resolve before closing out.</span>
          <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs text-amber-700 hover:bg-amber-100" onClick={() => setActiveTab("waivers")}>
            View Waivers
          </Button>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex items-center gap-1 mb-5 border-b border-border">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
            activeTab === "overview"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("invoices")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
            activeTab === "invoices"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Invoices
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
            activeTab === "logs"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Daily Logs
        </button>
        <button
          onClick={() => setActiveTab("tasks")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
            activeTab === "tasks"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Tasks
        </button>
        <button
          onClick={() => setActiveTab("attachments")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
            activeTab === "attachments"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Attachments
        </button>
        <button
          onClick={() => setActiveTab("selections")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
            activeTab === "selections"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Selections
        </button>
        <button
          onClick={() => setActiveTab("waivers")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
            activeTab === "waivers"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Lien Waivers
        </button>
        <button
          onClick={() => setActiveTab("crew")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
            activeTab === "crew"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Crew Costs
        </button>
        <button
          onClick={() => setActiveTab("costs")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
            activeTab === "costs"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Actual Costs
        </button>
        {showScorecard && (
          <button
            onClick={() => setActiveTab("scorecard")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === "scorecard"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Scorecard
          </button>
        )}
      </div>

      {/* Scorecard tab */}
      {activeTab === "scorecard" && showScorecard && (
        <JobCloseoutScorecard job={job} changeOrders={changeOrders} />
      )}

      {/* Invoices tab */}
      {activeTab === "invoices" && (
        <JobInvoices jobId={jobId} job={job} />
      )}

      {/* Daily Logs tab */}
      {activeTab === "logs" && (
        <JobDailyLogs jobId={jobId} job={job} />
      )}

      {/* Tasks tab */}
      {activeTab === "tasks" && (
        <JobTasks jobId={jobId} job={job} />
      )}

      {/* Attachments tab */}
      {activeTab === "attachments" && (
        <JobAttachments jobId={jobId} />
      )}

      {/* Selections tab */}
      {activeTab === "selections" && (
        <JobSelections jobId={jobId} job={job} />
      )}

      {/* Lien Waivers tab */}
      {activeTab === "waivers" && (
        <JobLienWaivers jobId={jobId} job={job} />
      )}

      {/* Crew Costs tab */}
      {activeTab === "crew" && (
        <JobCrewCosts jobId={jobId} job={job} />
      )}

      {/* Actual Costs tab */}
      {activeTab === "costs" && (
        <JobExpenses jobId={jobId} job={job} />
      )}

      {/* Overview tab */}
      <div className={(activeTab === "scorecard" || activeTab === "invoices" || activeTab === "logs" || activeTab === "tasks" || activeTab === "attachments" || activeTab === "selections" || activeTab === "waivers" || activeTab === "crew" || activeTab === "costs") ? "hidden" : "contents"}>
        {/* Estimate vs Actual Variance */}
        {showFinancials && (
          <JobVariancePanel
            job={job}
            changeOrders={changeOrders}
            timeEntries={timeEntries}
            crewCosts={crewCosts}
            expenses={jobExpenses}
          />
        )}

        {/* Real-Time Job Margin Rollup */}
        {showFinancials && jobMargins && (
          <div className="bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl p-4 mb-6 text-white">
            <p className="text-xs text-slate-300 uppercase tracking-wider mb-3 font-semibold">Real-Time Job Margin</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-slate-300">Contract</p>
                <p className="text-base font-bold">${(job.contract_value || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-300">+ CO Revenue</p>
                <p className="text-base font-bold text-blue-300">${jobMargins.totalApprovedRevenue.toLocaleString(undefined, {minimumFractionDigits: 0})}</p>
              </div>
              <div>
                <p className="text-xs text-slate-300">Adj. Revenue</p>
                <p className="text-base font-bold text-emerald-300">${jobMargins.adjustedRevenue.toLocaleString(undefined, {minimumFractionDigits: 0})}</p>
              </div>
              <div>
                <p className="text-xs text-slate-300">Adj. Cost</p>
                <p className="text-base font-bold text-slate-200">${jobMargins.adjustedCost.toLocaleString(undefined, {minimumFractionDigits: 0})}</p>
              </div>
              <div>
                <p className="text-xs text-slate-300">Margin</p>
                <p className={cn("text-xl font-black", jobMargins.realTimeMargin >= targetMargin ? "text-emerald-300" : "text-red-300")}>
                  {jobMargins.realTimeMargin.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-400">Target: {targetMargin}%</p>
              </div>
              {showFinancials && (
                <div>
                  <p className="text-xs text-slate-300">Job Profit</p>
                  <p className="text-base font-bold text-blue-300">${jobMargins.totalJobProfit.toLocaleString(undefined, {minimumFractionDigits: 0})}</p>
                  {jobMargins.profitPerHour !== null && (
                    <p className="text-xs text-slate-300">${jobMargins.profitPerHour.toFixed(0)}/hr</p>
                  )}
                </div>
              )}
              <div>
                <p className="text-xs text-slate-300">vs Industry</p>
                <p className={cn("text-base font-bold", jobMargins.performanceVsIndustry >= 0 ? "text-emerald-300" : "text-red-300")}>
                  {jobMargins.performanceVsIndustry >= 0 ? "+" : ""}{jobMargins.performanceVsIndustry.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-400">Avg: {jobMargins.industryAvgMargin}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Job summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 sm:mb-8">
          <SummaryCard label="Contract" value={`$${job.contract_value?.toLocaleString()}`} />
          <SummaryCard label="Approved CO Revenue" value={showFinancials ? `$${jobMargins?.totalApprovedRevenue?.toLocaleString(undefined, {minimumFractionDigits: 0}) ?? "0"}` : "••••"} highlight />
          <SummaryCard
            label="Approved CO Cost"
            value={showFinancials ? `$${jobMargins?.totalApprovedCost?.toLocaleString(undefined, {minimumFractionDigits: 0}) ?? "0"}` : "••••"}
          />
          <SummaryCard
            label="Total Leakage"
            value={showFinancials ? (totalLeakage > 0 ? `$${totalLeakage.toLocaleString(undefined, {minimumFractionDigits: 0})}` : "$0") : "••••"}
            danger={showFinancials && totalLeakage > 0}
          />
        </div>

        {/* Role badge */}
        {currentUser && (
          <div className="flex items-center gap-2 mb-5">
            {!showFinancials && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg">
                <Lock className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs text-amber-700 font-medium">Financial details hidden ({currentUser.role})</span>
              </div>
            )}
          </div>
        )}

        {/* Change orders list */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Change Orders ({changeOrders.length})
          </h2>
          <COStatusFilter value={coStatusFilter} onChange={setCoStatusFilter} counts={changeOrders} />
        </div>

        {cosLoading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)}
          </div>
        ) : changeOrders.length === 0 ? (
          <div className="bg-card rounded-xl border border-dashed border-border p-10 text-center">
            <p className="text-muted-foreground text-sm">No change orders yet</p>
            {canCreateCO(currentUser) && (
              <Button variant="outline" className="mt-3" size="sm" onClick={() => { setEditingCO(null); setShowForm(true); }}>
                Create your first change order
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {changeOrders
              .filter(co => coStatusFilter === "all" || co.status === coStatusFilter)
              .map(co => {
              const { marginDrop } = (co.status !== "approved" && job && co.total_cost > 0)
                ? calculateProjectedJobMargin(job, changeOrders.filter(c => c.status === "approved"), co)
                : { marginDrop: null };
              return (
                <ChangeOrderCard
                  key={co.id}
                  co={co}
                  targetMargin={targetMargin}
                  currentUser={currentUser}
                  showFinancials={showFinancials}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSendForApproval={(co) => sendForApprovalMutation.mutate(co)}
                  onDeletePhoto={(co, idx) => updatePhotosMutation.mutate({ id: co.id, photos: (co.photos || []).filter((_, i) => i !== idx) })}
                  projectedMarginDrop={marginDrop}
                  job={job}
                />
              );
            })}
          </div>
        )}

        {/* Client Portal */}
        <div className="mt-8">
          <ClientPortalPanel job={job} jobId={jobId} />
        </div>

        {/* Purchase Orders */}
        <div className="mt-8">
          <JobPurchaseOrders jobId={jobId} job={job} changeOrders={changeOrders} />
        </div>

        {/* Warranties - only for completed jobs */}
        {job.status === "completed" && (
          <div className="mt-8">
            <JobWarranties jobId={jobId} jobName={job.job_name} />
          </div>
        )}

        {/* Attachments */}
        <div className="mt-8">
          <JobAttachments jobId={jobId} />
        </div>

        {/* Change order form dialog */}
        <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingCO(null); } }}>
          <DialogContent className="w-full max-w-full sm:max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[92vh] overflow-y-auto rounded-none sm:rounded-xl p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>{editingCO ? "Edit Change Order" : "New Change Order"}</DialogTitle>
            </DialogHeader>
            <ChangeOrderForm
              initialData={editingCO || {}}
              userDefaults={currentUser}
              jobTargetMargin={job?.target_margin_percent ?? null}
              presets={presets}
              currentUser={currentUser}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditingCO(null); }}
            />
          </DialogContent>
        </Dialog>

        {/* Profit Pace Report */}
        {showReport && (
          <JobProfitReport job={job} changeOrders={changeOrders} jobMargins={jobMargins} onClose={() => setShowReport(false)} />
        )}

        {/* Delete confirmation */}
        <AlertDialog open={!!deletingCO} onOpenChange={() => setDeletingCO(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Change Order?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{deletingCO?.description}" and its associated flags.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => deleteCOMutation.mutate(deletingCO)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Job confirmation */}
        <AlertDialog open={showDeleteJob} onOpenChange={setShowDeleteJob}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this job?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this job? This cannot be undone. All related change orders, daily logs, tasks, invoices, attachments, selections, lien waivers, crew costs, and time entries will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteJobMutation.isPending}
                onClick={() => deleteJobMutation.mutate()}
              >
                {deleteJobMutation.isPending ? "Deleting..." : "Delete Job"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Save as Template Dialog */}
        {showSaveTemplate && (
          <SaveJobTemplateDialog job={job} open={showSaveTemplate} onClose={() => setShowSaveTemplate(false)} />
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, highlight, danger }) {
  return (
    <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={cn(
        "text-lg font-bold",
        danger ? "text-red-600" : highlight ? "text-blue-600" : "text-foreground"
      )}>
        {value}
      </p>
    </div>
  );
}

const CO_STATUS_OPTIONS = [
  { value: "all", label: "All", cls: "text-slate-600" },
  { value: "draft", label: "Draft", cls: "text-slate-600" },
  { value: "sent", label: "Sent", cls: "text-amber-600" },
  { value: "viewed", label: "Viewed", cls: "text-blue-600" },
  { value: "approved", label: "Approved", cls: "text-emerald-600" },
  { value: "declined", label: "Declined", cls: "text-red-600" },
];

function COStatusFilter({ value, onChange, counts }) {
  const count = (v) => v === "all" ? (counts?.length || 0) : (counts?.filter(c => c.status === v).length || 0);
  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {CO_STATUS_OPTIONS.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-colors",
            value === o.value
              ? "bg-slate-900 text-white border-slate-900"
              : cn("bg-white hover:bg-slate-50 border-slate-200", o.cls)
          )}
        >
          {o.label} <span className="opacity-60">({count(o.value)})</span>
        </button>
      ))}
    </div>
  );
}