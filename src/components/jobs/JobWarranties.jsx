import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Shield, Trash2, Pencil, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";

function getWarrantyStatus(endDate) {
  if (!endDate) return "unknown";
  const days = differenceInDays(new Date(endDate), new Date());
  if (days < 0) return "expired";
  if (days <= 30) return "expiring";
  return "active";
}

const STATUS_BADGE = {
  active: { label: "Active", color: "bg-emerald-100 text-emerald-700", icon: ShieldCheck },
  expiring: { label: "Expiring Soon", color: "bg-amber-100 text-amber-700", icon: ShieldAlert },
  expired: { label: "Expired", color: "bg-slate-100 text-slate-500", icon: ShieldX },
  unknown: { label: "No End Date", color: "bg-slate-100 text-slate-500", icon: Shield },
};

export default function JobWarranties({ jobId, jobName }) {
  const [showForm, setShowForm] = useState(false);
  const [editingW, setEditingW] = useState(null);
  const queryClient = useQueryClient();

  const { data: warranties = [], isLoading } = useQuery({
    queryKey: ["warranties", jobId],
    queryFn: () => base44.entities.Warranty.filter({ job_id: jobId }, "-created_date"),
    enabled: !!jobId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Warranty.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["warranties", jobId] }); queryClient.invalidateQueries({ queryKey: ["warranties"] }); toast.success("Warranty added"); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Warranty.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["warranties", jobId] }); queryClient.invalidateQueries({ queryKey: ["warranties"] }); toast.success("Warranty updated"); setShowForm(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Warranty.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["warranties", jobId] }); queryClient.invalidateQueries({ queryKey: ["warranties"] }); toast.success("Warranty deleted"); },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Warranties ({warranties.length})
        </h2>
        <Button size="sm" variant="outline" onClick={() => { setEditingW(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Warranty
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : warranties.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border p-8 text-center">
          <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No warranties added yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {warranties.map(w => {
            const status = getWarrantyStatus(w.end_date);
            const badge = STATUS_BADGE[status];
            const StatusIcon = badge.icon;
            const daysLeft = w.end_date ? differenceInDays(new Date(w.end_date), new Date()) : null;
            return (
              <Card key={w.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">{w.warranty_type}</span>
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", badge.color)}>
                          <StatusIcon className="h-3 w-3" />{badge.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 mt-1">{w.description || "—"}</p>
                      {w.vendor_responsible && <p className="text-xs text-slate-400 mt-0.5">Vendor: {w.vendor_responsible}</p>}
                      <div className="flex gap-3 mt-1">
                        {w.start_date && <span className="text-xs text-slate-400">Start: {format(new Date(w.start_date), "MMM d, yyyy")}</span>}
                        {w.end_date && <span className="text-xs text-slate-400">Expiry: {format(new Date(w.end_date), "MMM d, yyyy")}</span>}
                        {daysLeft !== null && daysLeft >= 0 && daysLeft <= 30 && (
                          <span className="text-xs text-amber-600 font-medium">{daysLeft} days left</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setEditingW(w); setShowForm(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500" onClick={() => deleteMutation.mutate(w.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showForm && (
        <WarrantyForm
          open={showForm}
          onClose={() => { setShowForm(false); setEditingW(null); }}
          editingW={editingW}
          jobName={jobName}
          onSave={(data) => {
            if (editingW) {
              updateMutation.mutate({ id: editingW.id, data });
            } else {
              createMutation.mutate({ ...data, job_id: jobId, job_name: jobName });
            }
          }}
        />
      )}
    </div>
  );
}

function WarrantyForm({ open, onClose, editingW, jobName, onSave }) {
  const [form, setForm] = useState({
    warranty_type: editingW?.warranty_type || "Labor",
    description: editingW?.description || "",
    start_date: editingW?.start_date || new Date().toISOString().split("T")[0],
    end_date: editingW?.end_date || "",
    vendor_responsible: editingW?.vendor_responsible || "",
    notes: editingW?.notes || "",
  });

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editingW ? "Edit Warranty" : "Add Warranty"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Warranty Type *</Label>
              <Select value={form.warranty_type} onValueChange={v => setForm(p => ({ ...p, warranty_type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Labor">Labor</SelectItem>
                  <SelectItem value="Materials">Materials</SelectItem>
                  <SelectItem value="Subcontractor">Subcontractor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Vendor Responsible</Label>
              <Input value={form.vendor_responsible} onChange={f("vendor_responsible")} className="mt-1" placeholder="e.g. ABC Supply" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-slate-500">Description</Label>
            <Textarea value={form.description} onChange={f("description")} className="mt-1" rows={2} placeholder="What is covered..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Start Date</Label>
              <Input type="date" value={form.start_date} onChange={f("start_date")} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">End Date / Expiry *</Label>
              <Input type="date" value={form.end_date} onChange={f("end_date")} className="mt-1" required />
            </div>
          </div>
          <div>
            <Label className="text-xs text-slate-500">Notes</Label>
            <Textarea value={form.notes} onChange={f("notes")} className="mt-1" rows={2} placeholder="Additional details..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">{editingW ? "Update Warranty" : "Add Warranty"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}