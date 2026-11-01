import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, HardHat, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { useCustomerAuth } from "@/lib/CustomerAuthContext";
import { getBurdenPercent, burdenedLaborCost } from "@/lib/laborBurden";

const WORKER_TYPES = ["Employee", "Subcontractor"];

const $ = (n) => `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

function computeTotalCost(form) {
  if (form.worker_type === "Subcontractor") {
    return parseFloat(form.quoted_amount) || 0;
  }
  return (parseFloat(form.hourly_rate) || 0) * (parseFloat(form.hours_worked) || 0);
}

export default function JobCrewCosts({ jobId, job }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const queryClient = useQueryClient();
  const { customer } = useCustomerAuth();
  const burdenPercent = getBurdenPercent(job, customer);

  const { data: costs = [], isLoading } = useQuery({
    queryKey: ["crewCosts", jobId],
    queryFn: () => base44.entities.CrewCost.filter({ job_id: jobId }, "-date"),
    enabled: !!jobId,
  });

  const refreshAlerts = async () => {
    try { await base44.functions.invoke("checkProfitLeakage", { job_id: jobId }); } catch {}
    queryClient.invalidateQueries({ queryKey: ["jobs"] });
  };

  const createMutation = useMutation({
    mutationFn: async (data) => { const c = await base44.entities.CrewCost.create(data); await refreshAlerts(); return c; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["crewCosts", jobId] }); toast.success("Crew cost added"); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => { const c = await base44.entities.CrewCost.update(id, data); await refreshAlerts(); return c; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["crewCosts", jobId] }); toast.success("Crew cost updated"); setShowForm(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => { await base44.entities.CrewCost.delete(id); await refreshAlerts(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["crewCosts", jobId] }); setDeleting(null); toast.success("Crew cost deleted"); },
  });

  const employeeCosts = costs.filter((c) => c.worker_type === "Employee");
  const employeeRawTotal = employeeCosts.reduce((s, c) => s + (c.total_cost || 0), 0);
  const employeeBurdenedTotal = employeeCosts.reduce((s, c) =>
    s + burdenedLaborCost(c.hours_worked, c.hourly_rate, burdenPercent), 0);
  const subTotal = costs.filter((c) => c.worker_type === "Subcontractor").reduce((s, c) => s + (c.total_cost || 0), 0);
  const combinedTotal = employeeBurdenedTotal + subTotal;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Crew Costs ({costs.length})</h2>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Entry
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Users className="h-3 w-3 text-blue-500" />
            <p className="text-xs text-muted-foreground">Employee Labor (burdened)</p>
          </div>
          <p className="text-lg font-bold text-blue-600">{$(employeeBurdenedTotal)}</p>
          <p className="text-xs text-slate-400">Raw wage: {$(employeeRawTotal)} · +{burdenPercent}% burden</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-1.5 mb-0.5">
            <HardHat className="h-3 w-3 text-purple-500" />
            <p className="text-xs text-muted-foreground">Subcontractor</p>
          </div>
          <p className="text-lg font-bold text-purple-600">{$(subTotal)}</p>
        </div>
        <div className="bg-slate-700 rounded-xl border border-slate-600 p-3">
          <p className="text-xs text-slate-300 mb-0.5">Combined Total</p>
          <p className="text-lg font-bold text-white">{$(combinedTotal)}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : costs.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border p-10 text-center">
          <HardHat className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No crew costs tracked yet</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left font-semibold text-foreground px-3 py-2">Worker</th>
                  <th className="text-left font-semibold text-foreground px-3 py-2">Type</th>
                  <th className="text-left font-semibold text-foreground px-3 py-2">Trade</th>
                  <th className="text-right font-semibold text-foreground px-3 py-2">Rate / Quoted</th>
                  <th className="text-right font-semibold text-foreground px-3 py-2">Hours</th>
                  <th className="text-right font-semibold text-foreground px-3 py-2">Total</th>
                  <th className="text-left font-semibold text-foreground px-3 py-2">Date</th>
                  <th className="text-right font-semibold text-foreground px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {costs.map((c) => (
                  <tr key={c.id} className="border-b border-border hover:bg-muted/30">
                    <td className="px-3 py-2">
                      <p className="font-medium text-foreground">{c.worker_name}</p>
                      {c.notes && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{c.notes}</p>}
                    </td>
                    <td className="px-3 py-2">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full", c.worker_type === "Employee" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600")}>
                        {c.worker_type}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{c.trade || "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {c.worker_type === "Subcontractor" ? $(c.quoted_amount) : `${$(c.hourly_rate)}/hr`}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{c.worker_type === "Employee" ? (c.hours_worked || 0) : "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-foreground">{$(c.total_cost)}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{c.date ? format(new Date(c.date), "MMM d, yyyy") : "—"}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400" onClick={() => { setEditing(c); setShowForm(true); }}><Pencil className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-red-500" onClick={() => setDeleting(c)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30 border-t-2 border-border">
                  <td colSpan={5} className="px-3 py-2 text-right font-semibold text-foreground">Combined Total</td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold text-blue-600">{$(combinedTotal)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <CrewCostForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        editing={editing}
        jobId={jobId}
        job={job}
        onSave={(data) => {
          if (editing) updateMutation.mutate({ id: editing.id, data });
          else createMutation.mutate(data);
        }}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      {deleting && (
        <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Delete Crew Cost?</DialogTitle></DialogHeader>
            <p className="text-sm text-slate-500">Delete the entry for {deleting.worker_name}?</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={() => deleteMutation.mutate(deleting.id)} disabled={deleteMutation.isPending}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function CrewCostForm({ open, onClose, editing, jobId, job, onSave, isPending }) {
  const [form, setForm] = useState({
    worker_name: "",
    worker_type: "Employee",
    trade: "",
    hourly_rate: "",
    quoted_amount: "",
    hours_worked: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    if (editing) {
      setForm({
        worker_name: editing.worker_name || "",
        worker_type: editing.worker_type || "Employee",
        trade: editing.trade || "",
        hourly_rate: editing.hourly_rate ?? "",
        quoted_amount: editing.quoted_amount ?? "",
        hours_worked: editing.hours_worked ?? "",
        date: editing.date || new Date().toISOString().split("T")[0],
        notes: editing.notes || "",
      });
    } else {
      setForm({
        worker_name: "",
        worker_type: "Employee",
        trade: "",
        hourly_rate: "",
        quoted_amount: "",
        hours_worked: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
    }
  }, [editing, open]);

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const liveTotal = computeTotalCost(form);

  const handleSubmit = (e) => {
    e.preventDefault();
    const total_cost = computeTotalCost(form);
    onSave({
      ...form,
      job_id: jobId,
      job_name: job?.job_name || "",
      hourly_rate: form.worker_type === "Employee" && form.hourly_rate !== "" ? parseFloat(form.hourly_rate) : null,
      quoted_amount: form.worker_type === "Subcontractor" && form.quoted_amount !== "" ? parseFloat(form.quoted_amount) : null,
      hours_worked: form.worker_type === "Employee" && form.hours_worked !== "" ? parseFloat(form.hours_worked) : null,
      total_cost,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Edit Crew Cost" : "New Crew Cost"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs text-slate-500">Worker / Vendor Name *</Label>
            <Input value={form.worker_name} onChange={f("worker_name")} required className="mt-1" placeholder="e.g. John Smith or ABC Electrical" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Worker Type</Label>
              <select value={form.worker_type} onChange={f("worker_type")} className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                {WORKER_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Trade / Role</Label>
              <Input value={form.trade} onChange={f("trade")} className="mt-1" placeholder="e.g. Electrician" />
            </div>
          </div>
          {form.worker_type === "Employee" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-500">Hourly Rate ($)</Label>
                <Input type="number" step="0.01" value={form.hourly_rate} onChange={f("hourly_rate")} className="mt-1" placeholder="0.00" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Hours Worked</Label>
                <Input type="number" step="0.25" value={form.hours_worked} onChange={f("hours_worked")} className="mt-1" placeholder="0" />
              </div>
            </div>
          ) : (
            <div>
              <Label className="text-xs text-slate-500">Quoted Amount ($)</Label>
              <Input type="number" step="0.01" value={form.quoted_amount} onChange={f("quoted_amount")} className="mt-1" placeholder="0.00" />
            </div>
          )}
          <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 px-4 py-2.5">
            <span className="text-xs font-medium text-slate-500">Calculated Total Cost</span>
            <span className="text-lg font-bold text-blue-600">{$(liveTotal)}</span>
          </div>
          <div>
            <Label className="text-xs text-slate-500">Date</Label>
            <Input type="date" value={form.date} onChange={f("date")} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Notes</Label>
            <Textarea value={form.notes} onChange={f("notes")} className="mt-1" rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isPending}>
              {isPending ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}