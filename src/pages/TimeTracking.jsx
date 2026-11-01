import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MobileSelect from "@/components/ui/MobileSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Clock, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { toast } from "sonner";
import { useCustomerAuth } from "@/lib/CustomerAuthContext";
import { getBurdenPercent, burdenedLaborCost, rawLaborCost } from "@/lib/laborBurden";

const $ = (n) => `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

export default function TimeTracking() {
  const [showForm, setShowForm] = useState(false);
  const [jobFilter, setJobFilter] = useState("all");
  const [currentUser, setCurrentUser] = useState(null);
  const { customer } = useCustomerAuth();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["timeEntries"],
    queryFn: () => base44.entities.TimeEntry.list("-date"),
  });
  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list("-created_date"),
  });
  const { data: changeOrders = [] } = useQuery({
    queryKey: ["changeOrders"],
    queryFn: () => base44.entities.ChangeOrder.list("-created_date"),
  });

  const refreshJobAlerts = async (jobId) => {
    if (!jobId) return;
    try { await base44.functions.invoke("checkProfitLeakage", { job_id: jobId }); } catch {}
    queryClient.invalidateQueries({ queryKey: ["jobs"] });
  };

  const deleteMutation = useMutation({
    mutationFn: async (entry) => {
      const jobId = entry.job_id;
      await base44.entities.TimeEntry.delete(entry.id);
      await refreshJobAlerts(jobId);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["timeEntries"] }); toast.success("Entry deleted"); },
  });

  const filtered = jobFilter === "all" ? entries : entries.filter(e => e.job_id === jobFilter);
  const totalHours = filtered.reduce((s, e) => s + (e.hours || 0), 0);
  const totalCostRaw = filtered.reduce((s, e) => s + rawLaborCost(e.hours, e.labor_rate), 0);
  const totalCostBurdened = filtered.reduce((s, e) => {
    const job = jobs.find(j => j.id === e.job_id);
    const bp = getBurdenPercent(job, customer);
    return s + burdenedLaborCost(e.hours, e.labor_rate, bp);
  }, 0);

  // Hours per job summary
  const jobHourMap = {};
  entries.forEach(e => {
    if (!jobHourMap[e.job_id]) jobHourMap[e.job_id] = 0;
    jobHourMap[e.job_id] += e.hours || 0;
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Time Tracking</h1>
          <p className="text-sm text-muted-foreground mt-1">Log actual labor hours per job</p>
        </div>
        <Button className="mt-3 sm:mt-0 bg-blue-600 hover:bg-blue-700" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Log Hours
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Hours Logged</p>
          <p className="text-xl font-bold text-foreground">{totalHours.toFixed(1)} hrs</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Labor Cost (burdened)</p>
          <p className="text-xl font-bold text-foreground">{$(totalCostBurdened)}</p>
          <p className="text-xs text-slate-400 mt-0.5">Raw wage: {$(totalCostRaw)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Entries</p>
          <p className="text-xl font-bold text-foreground">{filtered.length}</p>
        </div>
      </div>

      {/* Per-job breakdown */}
      {Object.keys(jobHourMap).length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Hours by Job</p>
          <div className="space-y-2">
            {Object.entries(jobHourMap).map(([jobId, hrs]) => {
              const job = jobs.find(j => j.id === jobId);
              const pct = totalHours > 0 ? (hrs / totalHours) * 100 : 0;
              return (
                <div key={jobId}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-700 font-medium">{job?.job_name || jobId}</span>
                    <span className="text-slate-500">{hrs.toFixed(1)} hrs</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="mb-4">
        <MobileSelect
          value={jobFilter}
          onValueChange={setJobFilter}
          placeholder="Filter by job"
          triggerClassName="w-52"
          options={[{ value: "all", label: "All Jobs" }, ...jobs.map(j => ({ value: j.id, label: j.job_name }))]}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border p-16 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No time entries yet</p>
          <Button variant="outline" className="mt-4" onClick={() => setShowForm(true)}>Log your first hours</Button>
        </div>
      ) : (
        <>
          {/* Mobile card layout */}
          <div className="sm:hidden space-y-3">
            {filtered.map(entry => {
              const job = jobs.find(j => j.id === entry.job_id);
              return (
                <div key={entry.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">{job?.job_name || "—"}</p>
                      {entry.worker_name && <p className="text-xs text-slate-500 mt-0.5">{entry.worker_name}</p>}
                      {entry.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{entry.description}</p>}
                      <p className="text-xs text-slate-400 mt-1">{entry.date ? format(new Date(entry.date), "MMM d, yyyy") : "—"}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">{(entry.hours || 0).toFixed(1)}</p>
                        <p className="text-xs text-slate-400">hrs</p>
                      </div>
                      <Button size="icon" variant="ghost" className="min-h-[44px] min-w-[44px] text-slate-400 hover:text-red-500" onClick={() => deleteMutation.mutate(entry)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table layout */}
          <div className="hidden sm:block bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Job</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Worker</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hours</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(entry => {
                  const job = jobs.find(j => j.id === entry.job_id);
                  return (
                    <tr key={entry.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 text-muted-foreground">{entry.date ? format(new Date(entry.date), "MMM d, yyyy") : "—"}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{job?.job_name || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{entry.worker_name || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{entry.description || "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">{(entry.hours || 0).toFixed(1)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button size="icon" variant="ghost" className="h-9 w-9 text-slate-400 hover:text-red-500" onClick={() => deleteMutation.mutate(entry)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <LogHoursDialog open={showForm} onClose={() => setShowForm(false)} jobs={jobs} changeOrders={changeOrders} queryClient={queryClient} currentUser={currentUser} />
    </div>
  );
}

function LogHoursDialog({ open, onClose, jobs, changeOrders, queryClient, currentUser }) {
  const [form, setForm] = useState({ job_id: "", change_order_id: "", description: "", hours: "", date: new Date().toISOString().split("T")[0], worker_name: "", labor_rate: "" });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const created = await base44.entities.TimeEntry.create(data);
      try { await base44.functions.invoke("checkProfitLeakage", { job_id: data.job_id }); } catch {}
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Hours logged");
      onClose();
      setForm({ job_id: "", change_order_id: "", description: "", hours: "", date: new Date().toISOString().split("T")[0], worker_name: "", labor_rate: "" });
    },
  });

  const jobCOs = changeOrders.filter(co => co.job_id === form.job_id);

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...form, hours: parseFloat(form.hours) || 0, labor_rate: parseFloat(form.labor_rate) || 0 });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Log Hours</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs text-slate-500">Job *</Label>
            <MobileSelect
              value={form.job_id}
              onValueChange={v => setForm(p => ({ ...p, job_id: v, change_order_id: "" }))}
              placeholder="Select job"
              triggerClassName="mt-1"
              options={jobs.map(j => ({ value: j.id, label: j.job_name }))}
            />
          </div>
          {jobCOs.length > 0 && (
            <div>
              <Label className="text-xs text-slate-500">Change Order (optional)</Label>
              <MobileSelect
                value={form.change_order_id}
                onValueChange={v => setForm(p => ({ ...p, change_order_id: v }))}
                placeholder="None"
                triggerClassName="mt-1"
                options={[{ value: "", label: "None" }, ...jobCOs.map(co => ({ value: co.id, label: co.description }))]}
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Date *</Label>
              <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="mt-1" required />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Hours *</Label>
              <Input type="number" step="0.25" min="0" value={form.hours} onChange={e => setForm(p => ({ ...p, hours: e.target.value }))} className="mt-1" required placeholder="0.0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Worker Name</Label>
              <Input value={form.worker_name} onChange={e => setForm(p => ({ ...p, worker_name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Labor Rate ($/hr)</Label>
              <Input type="number" value={form.labor_rate} onChange={e => setForm(p => ({ ...p, labor_rate: e.target.value }))} className="mt-1" placeholder="0.00" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-slate-500">Description</Label>
            <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="mt-1" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Log Hours"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}