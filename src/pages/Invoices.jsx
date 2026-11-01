import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import MobileSelect from "@/components/ui/MobileSelect";
import PullToRefresh from "@/components/ui/PullToRefresh";
import { Plus, Search, FileText, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import InvoiceDialog from "@/components/invoices/InvoiceDialog";
import QbExportButton from "@/components/exports/QbExportButton";
import { invoicesToQboCsv } from "@/lib/qbExport";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const STATUS_CONFIG = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-600", icon: FileText, rowColor: "" },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-700", icon: Clock, rowColor: "bg-yellow-50" },
  paid: { label: "Paid", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle, rowColor: "bg-emerald-50" },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-700", icon: AlertTriangle, rowColor: "bg-red-50" },
};

const $ = (n) => `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

function getDaysOutstanding(inv) {
  if (!inv.sent_date) return 0;
  const sent = new Date(inv.sent_date);
  const ref = inv.payment_received_date ? new Date(inv.payment_received_date) : new Date();
  return Math.floor((ref - sent) / (1000 * 60 * 60 * 24));
}

function computePaymentStatus(inv) {
  if (inv.status === "draft") return "unpaid";
  if (inv.status === "paid") return "paid";
  const days = getDaysOutstanding(inv);
  if (days > 30 && inv.status !== "paid") return "overdue";
  return "unpaid";
}

export default function Invoices() {
  const [showCreate, setShowCreate] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: invoices = [], isLoading, refetch: refetchInvoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => base44.entities.Invoice.list("-created_date"),
  });
  const { data: jobs = [], refetch: refetchJobs } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list("-created_date"),
  });
  const { data: changeOrders = [] } = useQuery({
    queryKey: ["changeOrders"],
    queryFn: () => base44.entities.ChangeOrder.list("-created_date"),
  });

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchInvoices(), refetchJobs()]);
  }, [refetchInvoices, refetchJobs]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["invoices"] });
      const previous = queryClient.getQueryData(["invoices"]);
      queryClient.setQueryData(["invoices"], (old = []) =>
        old.map(inv => inv.id === id ? { ...inv, ...data } : inv)
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["invoices"], ctx.previous);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Invoice.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });

  const filtered = invoices.filter(inv => {
    const matchSearch = !search ||
      inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      inv.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.job_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalInvoiced = invoices.reduce((s, i) => s + (i.total_amount || 0), 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.total_amount || 0), 0);
  const totalOutstanding = invoices.filter(i => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + (i.total_amount || 0), 0);
  const overdueCount = invoices.filter(i => computePaymentStatus(i) === "overdue").length;

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and manage client invoices</p>
        </div>
        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          <QbExportButton
            label="Export to QuickBooks"
            filename={`invoices-qbo-${new Date().toISOString().split("T")[0]}.csv`}
            buildCsv={() => invoicesToQboCsv(filtered, jobs)}
          />
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { setEditingInvoice(null); setShowCreate(true); }}>
            <Plus className="h-4 w-4 mr-1.5" /> New Invoice
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Invoiced</p>
          <p className="text-xl font-bold text-foreground">{$(totalInvoiced)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
          <p className="text-xl font-bold text-emerald-600">{$(totalPaid)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Outstanding</p>
          <p className="text-xl font-bold text-amber-600">{$(totalOutstanding)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Overdue</p>
          <p className="text-xl font-bold text-red-600">{overdueCount}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Invoices</p>
          <p className="text-xl font-bold text-foreground">{invoices.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <MobileSelect
          value={statusFilter}
          onValueChange={setStatusFilter}
          placeholder="Status"
          triggerClassName="w-36"
          options={[
            { value: "all", label: "All Status" },
            { value: "draft", label: "Draft" },
            { value: "sent", label: "Sent" },
            { value: "paid", label: "Paid" },
            { value: "overdue", label: "Overdue" },
          ]}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border p-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{search ? "No matching invoices" : "No invoices yet"}</p>
          <Button variant="outline" className="mt-4" onClick={() => setShowCreate(true)}>Create your first invoice</Button>
        </div>
      ) : (
        <>
          {/* Mobile card layout */}
          <div className="sm:hidden space-y-3">
            {filtered.map(inv => {
              const cfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
              const daysOut = inv.sent_date ? getDaysOutstanding(inv) : 0;
              return (
                <div key={inv.id} className={cn("bg-card rounded-xl border border-border p-4", cfg.rowColor)}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{inv.invoice_number || `INV-${inv.id?.slice(-6).toUpperCase()}`}</p>
                      <p className="font-medium text-foreground text-sm">{inv.client_name || "—"}</p>
                      {inv.job_name && <p className="text-xs text-slate-400">{inv.job_name}</p>}
                    </div>
                    <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", cfg.color)}>
                      <cfg.icon className="h-3 w-3" />{cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-slate-900">{$(inv.total_amount)}</p>
                      {inv.sent_date && inv.status !== "paid" && <p className="text-xs text-slate-400">{daysOut}d outstanding</p>}
                      {inv.due_date && <p className="text-xs text-slate-400">Due {format(new Date(inv.due_date), "MMM d, yyyy")}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {inv.status === "draft" && (
                        <Button size="sm" variant="outline" className="text-xs min-h-[44px] px-3" onClick={() => updateMutation.mutate({ id: inv.id, data: { status: "sent", sent_date: new Date().toISOString().split("T")[0] } })}>
                          Mark Sent
                        </Button>
                      )}
                      {inv.status === "sent" && (
                        <Button size="sm" variant="outline" className="text-xs min-h-[44px] px-3 text-emerald-600 border-emerald-200" onClick={() => updateMutation.mutate({ id: inv.id, data: { status: "paid", paid_date: new Date().toISOString().split("T")[0], payment_received_date: new Date().toISOString().split("T")[0] } })}>
                          Mark Paid
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-xs min-h-[44px] min-w-[44px]" onClick={() => { setEditingInvoice(inv); setShowCreate(true); }}>
                        Edit
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invoice #</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client / Job</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sent Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Date</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Days Out</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(inv => {
                  const cfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
                  const daysOut = inv.sent_date ? getDaysOutstanding(inv) : 0;
                  return (
                    <tr key={inv.id} className={cn("hover:bg-muted/50 transition-colors", cfg.rowColor)}>
                      <td className="px-4 py-3 font-medium text-foreground">{inv.invoice_number || `INV-${inv.id?.slice(-6).toUpperCase()}`}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{inv.client_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{inv.job_name}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {inv.sent_date ? format(new Date(inv.sent_date), "MMM d, yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {inv.due_date ? format(new Date(inv.due_date), "MMM d, yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">{$(inv.total_amount)}</td>
                      <td className="px-4 py-3 text-center">
                        {inv.sent_date && inv.status !== "paid" ? (
                          <span className={cn("text-xs font-medium", daysOut > 30 ? "text-red-600" : "text-amber-600")}>{daysOut}d</span>
                        ) : inv.status === "paid" ? (
                          <span className="text-xs text-emerald-600">—</span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", cfg.color)}>
                          <cfg.icon className="h-3 w-3" />{cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          {inv.status === "draft" && (
                            <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => updateMutation.mutate({ id: inv.id, data: { status: "sent", sent_date: new Date().toISOString().split("T")[0] } })}>
                              Mark Sent
                            </Button>
                          )}
                          {inv.status === "sent" && (
                            <Button size="sm" variant="outline" className="text-xs h-8 text-emerald-600 border-emerald-200" onClick={() => updateMutation.mutate({ id: inv.id, data: { status: "paid", paid_date: new Date().toISOString().split("T")[0], payment_received_date: new Date().toISOString().split("T")[0] } })}>
                              Mark Paid
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-xs h-8" onClick={() => { setEditingInvoice(inv); setShowCreate(true); }}>
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <InvoiceDialog
        open={showCreate}
        onClose={() => { setShowCreate(false); setEditingInvoice(null); }}
        invoice={editingInvoice}
        jobs={jobs}
        changeOrders={changeOrders}
        queryClient={queryClient}
      />
    </div>
    </PullToRefresh>
  );
}