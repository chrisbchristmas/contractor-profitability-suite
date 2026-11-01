import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, FileCheck, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

const WAIVER_TYPES = ["Conditional", "Unconditional"];
const STATUSES = ["Pending", "Received", "Executed"];

const STATUS_CONFIG = {
  Pending: { badge: "bg-amber-100 text-amber-700" },
  Received: { badge: "bg-blue-100 text-blue-700" },
  Executed: { badge: "bg-emerald-100 text-emerald-700" },
};

const $ = (n) => `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function JobLienWaivers({ jobId, job }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const queryClient = useQueryClient();

  const { data: waivers = [], isLoading } = useQuery({
    queryKey: ["lienWaivers", jobId],
    queryFn: () => base44.entities.LienWaiver.filter({ job_id: jobId }, "-date_issued"),
    enabled: !!jobId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LienWaiver.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["lienWaivers", jobId] }); toast.success("Lien waiver created"); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LienWaiver.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["lienWaivers", jobId] }); toast.success("Lien waiver updated"); setShowForm(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LienWaiver.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["lienWaivers", jobId] }); setDeleting(null); toast.success("Lien waiver deleted"); },
  });

  const markReceived = (w) => {
    updateMutation.mutate({
      id: w.id,
      data: {
        status: "Received",
        date_received: w.date_received || new Date().toISOString().split("T")[0],
      },
    });
  };

  const markExecuted = (w) => {
    updateMutation.mutate({
      id: w.id,
      data: {
        status: "Executed",
        date_received: w.date_received || new Date().toISOString().split("T")[0],
      },
    });
  };

  const totalIssued = waivers.reduce((s, w) => s + (w.amount || 0), 0);
  const totalReceived = waivers.filter(w => w.status === "Received" || w.status === "Executed").reduce((s, w) => s + (w.amount || 0), 0);
  const totalOutstanding = waivers.filter(w => w.status === "Pending").reduce((s, w) => s + (w.amount || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Lien Waivers ({waivers.length})</h2>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Waiver
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-card rounded-xl border border-border p-3">
          <p className="text-xs text-muted-foreground mb-0.5">Total Issued</p>
          <p className="text-lg font-bold text-foreground">{$(totalIssued)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3">
          <p className="text-xs text-muted-foreground mb-0.5">Total Received</p>
          <p className="text-lg font-bold text-emerald-600">{$(totalReceived)}</p>
        </div>
        <div className={cn("bg-card rounded-xl border p-3", totalOutstanding > 0 ? "border-amber-200" : "border-border")}>
          <p className="text-xs text-muted-foreground mb-0.5">Outstanding</p>
          <p className={cn("text-lg font-bold", totalOutstanding > 0 ? "text-amber-600" : "text-foreground")}>{$(totalOutstanding)}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : waivers.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border p-10 text-center">
          <FileCheck className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No lien waivers tracked yet</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left font-semibold text-foreground px-3 py-2">Party</th>
                  <th className="text-left font-semibold text-foreground px-3 py-2">Type</th>
                  <th className="text-right font-semibold text-foreground px-3 py-2">Amount</th>
                  <th className="text-left font-semibold text-foreground px-3 py-2">Issued</th>
                  <th className="text-left font-semibold text-foreground px-3 py-2">Received</th>
                  <th className="text-center font-semibold text-foreground px-3 py-2">Status</th>
                  <th className="text-right font-semibold text-foreground px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {waivers.map(w => {
                  const scfg = STATUS_CONFIG[w.status] || STATUS_CONFIG.Pending;
                  return (
                    <tr key={w.id} className="border-b border-border hover:bg-muted/30">
                      <td className="px-3 py-2">
                        <p className="font-medium text-foreground">{w.party_name}</p>
                        {w.notes && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{w.notes}</p>}
                      </td>
                      <td className="px-3 py-2">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full", w.waiver_type === "Conditional" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600")}>
                          {w.waiver_type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{$(w.amount)}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{w.date_issued ? format(new Date(w.date_issued), "MMM d, yyyy") : "—"}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{w.date_received ? format(new Date(w.date_received), "MMM d, yyyy") : "—"}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full", scfg.badge)}>{w.status}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1">
                          {w.status === "Pending" && (
                            <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => markReceived(w)}>
                              Mark Received
                            </Button>
                          )}
                          {w.status === "Received" && (
                            <Button size="sm" variant="outline" className="h-6 text-xs text-emerald-600 border-emerald-200" onClick={() => markExecuted(w)}>
                              <CheckCircle className="h-3 w-3 mr-1" /> Execute
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400" onClick={() => { setEditing(w); setShowForm(true); }}><Pencil className="h-3 w-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-red-500" onClick={() => setDeleting(w)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <LienWaiverForm
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
            <DialogHeader><DialogTitle>Delete Lien Waiver?</DialogTitle></DialogHeader>
            <p className="text-sm text-slate-500">Delete the waiver for {deleting.party_name}?</p>
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

function LienWaiverForm({ open, onClose, editing, jobId, job, onSave, isPending }) {
  const [form, setForm] = useState({
    waiver_type: "Conditional", party_name: "", amount: "", date_issued: "", date_received: "", status: "Pending", notes: "",
  });

  useEffect(() => {
    if (editing) {
      setForm({
        waiver_type: editing.waiver_type || "Conditional",
        party_name: editing.party_name || "",
        amount: editing.amount ?? "",
        date_issued: editing.date_issued || "",
        date_received: editing.date_received || "",
        status: editing.status || "Pending",
        notes: editing.notes || "",
      });
    } else {
      setForm({ waiver_type: "Conditional", party_name: "", amount: "", date_issued: new Date().toISOString().split("T")[0], date_received: "", status: "Pending", notes: "" });
    }
  }, [editing, open]);

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      job_id: jobId,
      job_name: job?.job_name || "",
      amount: form.amount !== "" ? parseFloat(form.amount) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Edit Lien Waiver" : "New Lien Waiver"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Waiver Type</Label>
              <select value={form.waiver_type} onChange={f("waiver_type")} className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                {WAIVER_TYPES.map(t => <option key={t}>{t}</option>)}
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
            <Label className="text-xs text-slate-500">Party Name *</Label>
            <Input value={form.party_name} onChange={f("party_name")} required className="mt-1" placeholder="e.g. ABC Electrical subcontractor" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Amount</Label>
            <Input type="number" step="0.01" value={form.amount} onChange={f("amount")} className="mt-1" placeholder="0.00" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Date Issued</Label>
              <Input type="date" value={form.date_issued} onChange={f("date_issued")} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Date Received</Label>
              <Input type="date" value={form.date_received} onChange={f("date_received")} className="mt-1" />
            </div>
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