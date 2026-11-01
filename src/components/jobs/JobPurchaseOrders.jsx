import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, AlertCircle, CheckCircle2, Clock, Trash2, Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_CONFIG = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-600", icon: FileText },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-700", icon: Clock },
  acknowledged: { label: "Acknowledged", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  disputed: { label: "Disputed", color: "bg-red-100 text-red-700", icon: AlertCircle },
};

const $ = (n) => `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function JobPurchaseOrders({ jobId, job, changeOrders }) {
  const [showForm, setShowForm] = useState(false);
  const [editingPO, setEditingPO] = useState(null);
  const queryClient = useQueryClient();

  const { data: pos = [], isLoading } = useQuery({
    queryKey: ["purchaseOrders", jobId],
    queryFn: () => base44.entities.SubcontractorPO.filter({ job_id: jobId }, "-created_date"),
    enabled: !!jobId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SubcontractorPO.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["purchaseOrders", jobId] }); toast.success("PO created"); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SubcontractorPO.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["purchaseOrders", jobId] }); toast.success("PO updated"); setShowForm(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SubcontractorPO.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["purchaseOrders", jobId] }); toast.success("PO deleted"); },
  });

  const totalCommitted = pos.reduce((s, po) => s + (po.po_amount || 0), 0);
  const outstanding = pos.filter(p => p.status !== "completed" && p.status !== "disputed").reduce((s, po) => s + (po.po_amount || 0), 0);
  const contractValue = job?.contract_value || 0;
  const committedPct = contractValue > 0 ? (totalCommitted / contractValue * 100) : 0;

  // Flag: Sent but not acknowledged within 48 hours
  const now = new Date();
  const unacknowledgedFlags = pos.filter(po => {
    if (po.status !== "sent") return false;
    const issued = new Date(po.date_issued || po.created_date);
    const hoursSince = (now - issued) / (1000 * 60 * 60);
    return hoursSince > 48;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Purchase Orders ({pos.length})
        </h2>
        <Button size="sm" variant="outline" onClick={() => { setEditingPO(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1" /> New PO
        </Button>
      </div>

      {/* Budget tracking */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Total Committed</p>
          <p className={cn("text-lg font-bold", committedPct > 100 ? "text-red-600" : "text-foreground")}>${(totalCommitted).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <p className="text-lg font-bold text-amber-600">{$(outstanding)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Contract Value</p>
          <p className="text-lg font-bold text-foreground">{$(contractValue)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Committed %</p>
          <p className={cn("text-lg font-bold", committedPct > 100 ? "text-red-600" : committedPct > 80 ? "text-amber-600" : "text-emerald-600")}>
            {committedPct.toFixed(0)}%
          </p>
        </CardContent></Card>
      </div>

      {unacknowledgedFlags.length > 0 && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">
            <strong>{unacknowledgedFlags.length}</strong> PO(s) sent but not acknowledged within 48 hours.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : pos.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border p-8 text-center">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No purchase orders yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pos.map(po => {
            const cfg = STATUS_CONFIG[po.status] || STATUS_CONFIG.draft;
            return (
              <Card key={po.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">{po.po_number || `PO-${po.id?.slice(-6).toUpperCase()}`}</span>
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", cfg.color)}>
                          <cfg.icon className="h-3 w-3" />{cfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 mt-0.5 truncate">{po.vendor_name}</p>
                      {po.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{po.description}</p>}
                      {po.change_order_id && (
                        <p className="text-xs text-blue-500 mt-0.5">Linked to CO</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{$(po.po_amount)}</p>
                        {po.date_issued && <p className="text-xs text-slate-400">Issued {format(new Date(po.date_issued), "MMM d")}</p>}
                        {po.expected_completion_date && <p className="text-xs text-slate-400">Exp: {format(new Date(po.expected_completion_date), "MMM d")}</p>}
                      </div>
                      <div className="flex gap-1">
                        {po.status === "sent" && (
                          <Button size="sm" variant="outline" className="text-xs h-8 text-emerald-600 border-emerald-200"
                            onClick={() => updateMutation.mutate({ id: po.id, data: { status: "acknowledged", acknowledged_date: new Date().toISOString().split("T")[0] } })}>
                            Acknowledge
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setEditingPO(po); setShowForm(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500" onClick={() => deleteMutation.mutate(po.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showForm && (
        <POForm
          open={showForm}
          onClose={() => { setShowForm(false); setEditingPO(null); }}
          jobId={jobId}
          changeOrders={changeOrders}
          editingPO={editingPO}
          onSave={(data) => {
            if (editingPO) {
              updateMutation.mutate({ id: editingPO.id, data });
            } else {
              const poNumber = `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
              createMutation.mutate({ ...data, po_number: data.po_number || poNumber, date_issued: data.date_issued || new Date().toISOString().split("T")[0] });
            }
          }}
        />
      )}
    </div>
  );
}

function POForm({ open, onClose, jobId, changeOrders, editingPO, onSave }) {
  const [form, setForm] = useState({
    vendor_name: editingPO?.vendor_name || "",
    description: editingPO?.description || "",
    po_amount: editingPO?.po_amount || "",
    date_issued: editingPO?.date_issued || new Date().toISOString().split("T")[0],
    expected_completion_date: editingPO?.expected_completion_date || "",
    change_order_id: editingPO?.change_order_id || "",
    status: editingPO?.status || "draft",
  });

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      po_amount: parseFloat(form.po_amount) || 0,
      job_id: jobId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editingPO ? "Edit PO" : "New Purchase Order"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs text-slate-500">Subcontractor / Vendor Name *</Label>
            <Input value={form.vendor_name} onChange={f("vendor_name")} className="mt-1" required placeholder="e.g. ABC Electrical" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Description of Work</Label>
            <Textarea value={form.description} onChange={f("description")} className="mt-1" rows={2} placeholder="Scope of work..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">PO Amount ($) *</Label>
              <Input type="number" step="0.01" value={form.po_amount} onChange={f("po_amount")} className="mt-1" required placeholder="0.00" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Date Issued</Label>
              <Input type="date" value={form.date_issued} onChange={f("date_issued")} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Expected Completion</Label>
              <Input type="date" value={form.expected_completion_date} onChange={f("expected_completion_date")} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-slate-500">Link to Change Order (optional)</Label>
            <Select value={form.change_order_id} onValueChange={v => setForm(p => ({ ...p, change_order_id: v }))}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select CO" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>None</SelectItem>
                {changeOrders.map(co => <SelectItem key={co.id} value={co.id}>{co.description}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">{editingPO ? "Update PO" : "Create PO"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}