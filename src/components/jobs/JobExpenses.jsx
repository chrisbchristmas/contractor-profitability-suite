import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MobileSelect from "@/components/ui/MobileSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Receipt } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { toast } from "sonner";
import { COST_CATEGORIES } from "@/lib/jobVariance";

const $ = (n) => `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const CAT_OPTIONS = COST_CATEGORIES.map((c) => ({ value: c.key, label: c.label }));

export default function JobExpenses({ jobId, job, onRefreshAlerts }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["jobExpenses", jobId],
    queryFn: () => base44.entities.JobExpense.filter({ job_id: jobId }, "-date"),
    enabled: !!jobId,
  });

  const refreshAlerts = async () => {
    try { await base44.functions.invoke("checkProfitLeakage", { job_id: jobId }); } catch {}
    queryClient.invalidateQueries({ queryKey: ["jobs"] });
    onRefreshAlerts?.();
  };

  const createMutation = useMutation({
    mutationFn: async (data) => { const c = await base44.entities.JobExpense.create(data); await refreshAlerts(); return c; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["jobExpenses", jobId] }); toast.success("Cost added"); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => { const c = await base44.entities.JobExpense.update(id, data); await refreshAlerts(); return c; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["jobExpenses", jobId] }); toast.success("Cost updated"); setShowForm(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => { await base44.entities.JobExpense.delete(id); await refreshAlerts(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["jobExpenses", jobId] }); setDeleting(null); toast.success("Cost deleted"); },
  });

  const total = expenses.reduce((s, x) => s + (x.amount || 0), 0);
  const byCategory = COST_CATEGORIES.map((c) => ({
    ...c,
    total: expenses.filter((x) => x.category === c.key).reduce((s, x) => s + (x.amount || 0), 0),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Actual Costs ({expenses.length})</h2>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Cost
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {byCategory.map((c) => (
          <div key={c.key} className="bg-card rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="text-base font-bold text-foreground">{$(c.total)}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : expenses.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border p-10 text-center">
          <Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No actual costs logged yet</p>
          <p className="text-xs text-muted-foreground mt-1">Track materials, subcontractor, equipment, or extra labor costs as they occur.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left font-semibold text-foreground px-3 py-2">Category</th>
                  <th className="text-left font-semibold text-foreground px-3 py-2">Note</th>
                  <th className="text-right font-semibold text-foreground px-3 py-2">Amount</th>
                  <th className="text-left font-semibold text-foreground px-3 py-2">Date</th>
                  <th className="text-right font-semibold text-foreground px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((x) => {
                  const cat = COST_CATEGORIES.find((c) => c.key === x.category);
                  return (
                    <tr key={x.id} className="border-b border-border hover:bg-muted/30">
                      <td className="px-3 py-2"><span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{cat?.label || x.category}</span></td>
                      <td className="px-3 py-2 text-muted-foreground">{x.note || "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold text-foreground">{$(x.amount)}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{x.date ? format(new Date(x.date), "MMM d, yyyy") : "—"}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400" onClick={() => { setEditing(x); setShowForm(true); }}><Pencil className="h-3 w-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-red-500" onClick={() => setDeleting(x)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30 border-t-2 border-border">
                  <td colSpan={2} className="px-3 py-2 text-right font-semibold text-foreground">Total</td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold text-blue-600">{$(total)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <ExpenseForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        editing={editing}
        jobId={jobId}
        job={job}
        onSave={(data) => editing ? updateMutation.mutate({ id: editing.id, data }) : createMutation.mutate(data)}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      {deleting && (
        <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Delete Cost Entry?</DialogTitle></DialogHeader>
            <p className="text-sm text-slate-500">Delete this {deleting.category} entry ({$(deleting.amount)})?</p>
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

function ExpenseForm({ open, onClose, editing, jobId, job, onSave, isPending }) {
  const [form, setForm] = useState({
    category: "materials", amount: "", note: "", date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (editing) {
      setForm({
        category: editing.category || "materials",
        amount: editing.amount ?? "",
        note: editing.note || "",
        date: editing.date || new Date().toISOString().split("T")[0],
      });
    } else {
      setForm({ category: "materials", amount: "", note: "", date: new Date().toISOString().split("T")[0] });
    }
  }, [editing, open]);

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      job_id: jobId,
      job_name: job?.job_name || "",
      amount: parseFloat(form.amount) || 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{editing ? "Edit Cost" : "Log Actual Cost"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs text-slate-500">Category *</Label>
            <MobileSelect
              value={form.category}
              onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}
              triggerClassName="mt-1 w-full"
              options={CAT_OPTIONS}
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Amount ($) *</Label>
            <Input type="number" step="0.01" min="0" value={form.amount} onChange={f("amount")} className="mt-1" placeholder="0.00" required />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Note</Label>
            <Textarea value={form.note} onChange={f("note")} className="mt-1" rows={2} placeholder="What was this cost for?" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Date</Label>
            <Input type="date" value={form.date} onChange={f("date")} className="mt-1" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isPending}>
              {isPending ? "Saving..." : editing ? "Update" : "Add Cost"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}