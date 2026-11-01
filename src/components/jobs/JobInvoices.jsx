import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, FileText, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

const STATUS_CONFIG = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-600", icon: FileText },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-700", icon: Clock },
  paid: { label: "Paid", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-700", icon: AlertTriangle },
};

const $ = (n) => `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

export default function JobInvoices({ jobId, job }) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", "job", jobId],
    queryFn: () => base44.entities.Invoice.filter({ job_id: jobId }, "-created_date"),
    enabled: !!jobId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices", "job", jobId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Invoice.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invoices", "job", jobId] }); toast.success("Invoice deleted"); },
  });

  const totalInvoiced = invoices.reduce((s, i) => s + (i.total_amount || 0), 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.total_amount || 0), 0);
  const totalOutstanding = invoices.filter(i => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + (i.total_amount || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Invoices ({invoices.length})</h2>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => { setEditingInvoice(null); setShowCreate(true); }}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Invoice
        </Button>
      </div>

      {/* Mini summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-card rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Total Invoiced</p>
          <p className="text-base font-bold text-foreground">{$(totalInvoiced)}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Paid</p>
          <p className="text-base font-bold text-emerald-600">{$(totalPaid)}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <p className="text-base font-bold text-amber-600">{$(totalOutstanding)}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : invoices.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border p-10 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No invoices for this job yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map(inv => {
            const cfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
            return (
              <div key={inv.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground text-sm truncate">{inv.invoice_number || `INV-${inv.id?.slice(-6).toUpperCase()}`}</p>
                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0", cfg.color)}>
                      <cfg.icon className="h-3 w-3" />{cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="font-semibold text-foreground">{$(inv.total_amount)}</span>
                    {inv.due_date && <span>Due {format(new Date(inv.due_date), "MMM d, yyyy")}</span>}
                    {inv.paid_date && <span className="text-emerald-600">Paid {format(new Date(inv.paid_date), "MMM d")}</span>}
                  </div>
                  {inv.notes && <p className="text-xs text-slate-400 mt-0.5 truncate">{inv.notes}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {inv.status === "draft" && (
                    <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => updateMutation.mutate({ id: inv.id, data: { status: "sent", sent_date: new Date().toISOString().split("T")[0] } })}>
                      Mark Sent
                    </Button>
                  )}
                  {inv.status === "sent" && (
                    <Button size="sm" variant="outline" className="text-xs h-8 text-emerald-600 border-emerald-200" onClick={() => updateMutation.mutate({ id: inv.id, data: { status: "paid", paid_date: new Date().toISOString().split("T")[0] } })}>
                      Mark Paid
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-xs h-8 text-red-500" onClick={() => deleteMutation.mutate(inv.id)}>Delete</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick create invoice dialog for this job */}
      {showCreate && (
        <QuickInvoiceDialog
          jobId={jobId}
          job={job}
          invoice={editingInvoice}
          open={showCreate}
          onClose={() => { setShowCreate(false); setEditingInvoice(null); }}
          queryClient={queryClient}
        />
      )}
    </div>
  );
}

function QuickInvoiceDialog({ jobId, job, invoice, open, onClose, queryClient }) {
  const [form, setForm] = useState({
    invoice_number: "",
    total_amount: "",
    due_date: "",
    notes: "",
    status: "draft",
  });

  useEffect(() => {
    if (invoice) {
      setForm({
        invoice_number: invoice.invoice_number || "",
        total_amount: invoice.total_amount || "",
        due_date: invoice.due_date || "",
        notes: invoice.notes || "",
        status: invoice.status || "draft",
      });
    } else {
      setForm({ invoice_number: "", total_amount: "", due_date: "", notes: "", status: "draft" });
    }
  }, [invoice, open]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invoices", "job", jobId] }); queryClient.invalidateQueries({ queryKey: ["invoices"] }); toast.success("Invoice created"); onClose(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invoices", "job", jobId] }); queryClient.invalidateQueries({ queryKey: ["invoices"] }); toast.success("Invoice updated"); onClose(); },
  });

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      job_id: jobId,
      job_name: job?.job_name || "",
      client_name: job?.client_name || "",
      total_amount: parseFloat(form.total_amount) || 0,
      paid_date: form.status === "paid" ? (invoice?.paid_date || new Date().toISOString().split("T")[0]) : null,
      sent_date: form.status === "sent" || form.status === "paid" ? (invoice?.sent_date || new Date().toISOString().split("T")[0]) : null,
    };
    if (invoice) updateMutation.mutate({ id: invoice.id, data });
    else createMutation.mutate(data);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{invoice ? "Edit Invoice" : "New Invoice"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Invoice Number</Label>
              <Input value={form.invoice_number} onChange={f("invoice_number")} className="mt-1" placeholder="Auto if blank" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Amount *</Label>
              <Input type="number" step="0.01" value={form.total_amount} onChange={f("total_amount")} required className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Due Date</Label>
              <Input type="date" value={form.due_date} onChange={f("due_date")} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Status</Label>
              <select value={form.status} onChange={f("status")} className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
          <div>
            <Label className="text-xs text-slate-500">Notes</Label>
            <Input value={form.notes} onChange={f("notes")} className="mt-1" placeholder="Payment terms, instructions..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isPending}>
              {isPending ? "Saving..." : invoice ? "Update" : "Create Invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}