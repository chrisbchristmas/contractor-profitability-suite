import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, AlertTriangle, ClipboardList } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format, isPast, isToday } from "date-fns";
import { toast } from "sonner";

const CATEGORIES = ["Flooring", "Cabinets", "Countertops", "Fixtures", "Paint", "Appliances", "Other"];
const STATUSES = ["Pending", "Selected", "Approved", "Ordered"];

const STATUS_CONFIG = {
  Pending: { badge: "bg-slate-100 text-slate-600" },
  Selected: { badge: "bg-blue-100 text-blue-700" },
  Approved: { badge: "bg-emerald-100 text-emerald-700" },
  Ordered: { badge: "bg-purple-100 text-purple-700" },
};

const CAT_COLORS = {
  Flooring: "bg-amber-50 text-amber-700",
  Cabinets: "bg-orange-50 text-orange-700",
  Countertops: "bg-stone-100 text-stone-700",
  Fixtures: "bg-cyan-50 text-cyan-700",
  Paint: "bg-violet-50 text-violet-700",
  Appliances: "bg-slate-100 text-slate-700",
  Other: "bg-gray-100 text-gray-700",
};

const $ = (n) => `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function JobSelections({ jobId, job }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const queryClient = useQueryClient();

  const { data: selections = [], isLoading } = useQuery({
    queryKey: ["selections", jobId],
    queryFn: () => base44.entities.Selection.filter({ job_id: jobId }, "-created_date"),
    enabled: !!jobId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Selection.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["selections", jobId] }); toast.success("Selection created"); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Selection.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["selections", jobId] }); toast.success("Selection updated"); setShowForm(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Selection.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["selections", jobId] }); setDeleting(null); toast.success("Selection deleted"); },
  });

  const totalAllowance = selections.reduce((s, sel) => s + (sel.allowance_amount || 0), 0);
  const totalActual = selections.reduce((s, sel) => s + (sel.actual_amount || 0), 0);
  const totalVariance = totalActual - totalAllowance;
  const overAllowanceCount = selections.filter(s => (s.actual_amount || 0) > (s.allowance_amount || 0) && s.actual_amount != null).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Selections & Allowances ({selections.length})</h2>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Selection
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-card rounded-xl border border-border p-3">
          <p className="text-xs text-muted-foreground mb-0.5">Total Allowances</p>
          <p className="text-lg font-bold text-foreground">{$(totalAllowance)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3">
          <p className="text-xs text-muted-foreground mb-0.5">Total Actuals</p>
          <p className="text-lg font-bold text-foreground">{$(totalActual)}</p>
        </div>
        <div className={cn("bg-card rounded-xl border p-3", totalVariance > 0 ? "border-red-200" : "border-border")}>
          <p className="text-xs text-muted-foreground mb-0.5">Over/(Under) Allowance</p>
          <p className={cn("text-lg font-bold", totalVariance > 0 ? "text-red-600" : "text-emerald-600")}>
            {totalVariance >= 0 ? "+" : ""}${totalVariance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : selections.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border p-10 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No selections yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {selections.map(sel => {
            const scfg = STATUS_CONFIG[sel.status] || STATUS_CONFIG.Pending;
            const ccolor = CAT_COLORS[sel.category] || CAT_COLORS.Other;
            const variance = (sel.actual_amount || 0) - (sel.allowance_amount || 0);
            const overAllowance = sel.actual_amount != null && sel.actual_amount > (sel.allowance_amount || 0);
            const overdue = sel.due_date && sel.status !== "Ordered" && isPast(new Date(sel.due_date)) && !isToday(new Date(sel.due_date));
            return (
              <div key={sel.id} className="bg-card rounded-xl border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground">{sel.item_name}</p>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full", ccolor)}>{sel.category}</span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full", scfg.badge)}>{sel.status}</span>
                      {overAllowance && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                          <AlertTriangle className="h-3 w-3" /> Over Allowance — CO Needed
                        </span>
                      )}
                      {overdue && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Overdue</span>
                      )}
                    </div>
                    {sel.client_selection_notes && <p className="text-xs text-muted-foreground mt-1">{sel.client_selection_notes}</p>}
                    <div className="flex items-center gap-4 mt-1.5 text-xs">
                      <span className="text-muted-foreground">Allowance: <strong className="text-foreground">{$(sel.allowance_amount)}</strong></span>
                      <span className="text-muted-foreground">Actual: <strong className="text-foreground">{$(sel.actual_amount)}</strong></span>
                      <span className={cn("font-semibold", variance > 0 ? "text-red-600" : variance < 0 ? "text-emerald-600" : "text-muted-foreground")}>
                        Variance: {variance >= 0 ? "+" : ""}${variance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                      {sel.due_date && <span className="text-muted-foreground">Due: {format(new Date(sel.due_date), "MMM d")}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400" onClick={() => { setEditing(sel); setShowForm(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => setDeleting(sel)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SelectionForm
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
            <DialogHeader><DialogTitle>Delete Selection?</DialogTitle></DialogHeader>
            <p className="text-sm text-slate-500">Delete "{deleting.item_name}"?</p>
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

function SelectionForm({ open, onClose, editing, jobId, job, onSave, isPending }) {
  const [form, setForm] = useState({
    category: "Flooring", item_name: "", allowance_amount: "", actual_amount: "", client_selection_notes: "", status: "Pending", due_date: "",
  });

  useEffect(() => {
    if (editing) {
      setForm({
        category: editing.category || "Flooring",
        item_name: editing.item_name || "",
        allowance_amount: editing.allowance_amount ?? "",
        actual_amount: editing.actual_amount ?? "",
        client_selection_notes: editing.client_selection_notes || "",
        status: editing.status || "Pending",
        due_date: editing.due_date || "",
      });
    } else {
      setForm({ category: "Flooring", item_name: "", allowance_amount: "", actual_amount: "", client_selection_notes: "", status: "Pending", due_date: "" });
    }
  }, [editing, open]);

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      job_id: jobId,
      job_name: job?.job_name || "",
      allowance_amount: form.allowance_amount !== "" ? parseFloat(form.allowance_amount) : null,
      actual_amount: form.actual_amount !== "" ? parseFloat(form.actual_amount) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Edit Selection" : "New Selection"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Category</Label>
              <select value={form.category} onChange={f("category")} className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Status</Label>
              <select value={form.status} onChange={f("status")} className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label className="text-xs text-slate-500">Item Name *</Label>
            <Input value={form.item_name} onChange={f("item_name")} required className="mt-1" placeholder="e.g. Hardwood flooring for living room" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Allowance Amount</Label>
              <Input type="number" step="0.01" value={form.allowance_amount} onChange={f("allowance_amount")} className="mt-1" placeholder="0.00" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Actual Amount</Label>
              <Input type="number" step="0.01" value={form.actual_amount} onChange={f("actual_amount")} className="mt-1" placeholder="0.00" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-slate-500">Due Date</Label>
            <Input type="date" value={form.due_date} onChange={f("due_date")} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Client Selection Notes</Label>
            <Textarea value={form.client_selection_notes} onChange={f("client_selection_notes")} className="mt-1" rows={2} placeholder="Client preferences, color, model, etc." />
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