import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PullToRefresh from "@/components/ui/PullToRefresh";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MobileSelect from "@/components/ui/MobileSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Briefcase, Download, Bookmark } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import JobCard from "@/components/jobs/JobCard";
import { isOwner, isPM, canViewJob } from "@/components/auth/permissions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Jobs() {
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  const { data: jobs = [], isLoading, refetch: refetchJobs } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list("-created_date"),
  });
  const { data: changeOrders = [], refetch: refetchCOs } = useQuery({
    queryKey: ["changeOrders"],
    queryFn: () => base44.entities.ChangeOrder.list("-created_date"),
  });

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchJobs(), refetchCOs()]);
  }, [refetchJobs, refetchCOs]);

  // Filter by role-based visibility
  const visibleJobs = jobs.filter(j => canViewJob(currentUser, j));

  const filtered = visibleJobs.filter(j => {
    const matchSearch = !search || j.job_name?.toLowerCase().includes(search.toLowerCase()) || j.client_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || j.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const canCreate = isOwner(currentUser) || isPM(currentUser);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Jobs</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your projects and contracts</p>
        </div>
        <div className="flex gap-2 mt-3 sm:mt-0">
          <Button variant="outline" onClick={async () => {
            const res = await base44.functions.invoke('exportJobsCSV', {});
            const blob = new Blob([res.data], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'jobs_export.csv'; a.click();
            URL.revokeObjectURL(url);
          }}>
            <Download className="h-4 w-4 mr-1.5" /> Export CSV
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> New Job
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search jobs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <MobileSelect
          value={statusFilter}
          onValueChange={setStatusFilter}
          placeholder="Status"
          triggerClassName="w-36"
          options={[
            { value: "all", label: "All Status" },
            { value: "active", label: "Active" },
            { value: "completed", label: "Completed" },
          ]}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-[180px] rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border p-16 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{search ? "No matching jobs" : "No jobs yet"}</p>
          <Button variant="outline" className="mt-4" onClick={() => setShowCreate(true)}>
            Create your first job
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(job => (
            <JobCard key={job.id} job={job} changeOrders={changeOrders} currentUser={currentUser} />
          ))}
        </div>
      )}

      <CreateJobDialog open={showCreate} onClose={() => setShowCreate(false)} queryClient={queryClient} currentUser={currentUser} />
    </div>
    </PullToRefresh>
  );
}

function CreateJobDialog({ open, onClose, queryClient, currentUser }) {
  const [form, setForm] = useState({
    job_name: "",
    client_name: "",
    contract_value: "",
    estimated_cost: "",
    target_margin_percent: "",
    status: "active",
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["jobTemplates"],
    queryFn: () => base44.entities.JobTemplate.list("-created_date"),
  });

  const applyTemplate = (templateId) => {
    const t = templates.find(t => t.id === templateId);
    if (!t) return;
    const laborCost = t.estimated_labor_cost || 0;
    const materialCost = t.estimated_material_cost || 0;
    const overheadPct = t.overhead_percent || 0;
    const overheadCost = (laborCost + materialCost) * (overheadPct / 100);
    const estimatedCost = laborCost + materialCost + overheadCost;
    const targetMargin = t.profit_target_percent || 30;
    const contractValue = estimatedCost / (1 - targetMargin / 100);
    setForm({
      job_name: t.template_name || "",
      client_name: "",
      contract_value: contractValue > 0 ? contractValue.toFixed(2) : "",
      estimated_cost: estimatedCost > 0 ? estimatedCost.toFixed(2) : "",
      target_margin_percent: t.profit_target_percent || "",
      status: "active",
    });
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Job.create(data),
    onMutate: async (newJob) => {
      await queryClient.cancelQueries({ queryKey: ["jobs"] });
      const previous = queryClient.getQueryData(["jobs"]);
      queryClient.setQueryData(["jobs"], (old = []) => [
        { ...newJob, id: `temp-${Date.now()}`, created_date: new Date().toISOString() },
        ...old,
      ]);
      return { previous };
    },
    onError: (_err, _newJob, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["jobs"], ctx.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      onClose();
      setForm({ job_name: "", client_name: "", contract_value: "", estimated_cost: "", target_margin_percent: "", status: "active" });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      contract_value: parseFloat(form.contract_value) || 0,
      estimated_cost: parseFloat(form.estimated_cost) || 0,
      target_margin_percent: form.target_margin_percent ? parseFloat(form.target_margin_percent) : null,
      user_id: currentUser?.id,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {templates.length > 0 && (
            <div>
              <Label className="text-xs text-slate-500">Start from a Template</Label>
              <Select onValueChange={applyTemplate}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.template_name}{t.trade_type ? ` — ${t.trade_type}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="text-xs text-slate-500">Job Name *</Label>
            <Input value={form.job_name} onChange={e => setForm(p => ({...p, job_name: e.target.value}))} required className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Client Name</Label>
            <Input value={form.client_name} onChange={e => setForm(p => ({...p, client_name: e.target.value}))} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Contract Value *</Label>
              <Input type="number" step="0.01" value={form.contract_value} onChange={e => setForm(p => ({...p, contract_value: e.target.value}))} required className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Estimated Cost *</Label>
              <Input type="number" step="0.01" value={form.estimated_cost} onChange={e => setForm(p => ({...p, estimated_cost: e.target.value}))} required className="mt-1" />
            </div>
          </div>
          {isOwner(currentUser) && (
            <div>
              <Label className="text-xs text-slate-500">Target Margin % (leave blank for default)</Label>
              <Input type="number" step="0.01" value={form.target_margin_percent} onChange={e => setForm(p => ({...p, target_margin_percent: e.target.value}))} className="mt-1" placeholder="Uses your default" />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}