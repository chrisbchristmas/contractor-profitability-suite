import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const money = (n) => Math.round(n * 100) / 100;
// CO price before sales tax; tax is billed as its own line so retainage is never withheld on tax.
const preTax = (co) => co.sell_price != null ? Number(co.sell_price) || 0 : (co.final_price_to_client || 0) - (co.tax_amount || 0);

export default function InvoiceDialog({ open, onClose, invoice, jobs, changeOrders, invoices = [], queryClient }) {
  const [form, setForm] = useState({ job_id: "", invoice_number: "", due_date: "", notes: "", status: "draft", sent_date: "", payment_received_date: "", payment_amount: "" });
  const [selectedCOIds, setSelectedCOIds] = useState([]);
  // Progress billing + retainage live in line_items (tagged by `kind`), so no schema change.
  const [progress, setProgress] = useState({ percent: "", retainage: "", release: false });

  useEffect(() => {
    if (invoice) {
      setForm({
        job_id: invoice.job_id || "",
        invoice_number: invoice.invoice_number || "",
        due_date: invoice.due_date || "",
        notes: invoice.notes || "",
        status: invoice.status || "draft",
        sent_date: invoice.sent_date || "",
        payment_received_date: invoice.payment_received_date || "",
        payment_amount: invoice.payment_amount || "",
      });
      setSelectedCOIds(invoice.change_order_ids || []);
      const items = invoice.line_items || [];
      setProgress({
        percent: items.find(i => i.kind === "progress")?.percent ?? "",
        retainage: items.find(i => i.kind === "retainage")?.percent ?? "",
        release: items.some(i => i.kind === "retainage_release"),
      });
    } else {
      setForm({ job_id: "", invoice_number: "", due_date: "", notes: "", status: "draft", sent_date: "", payment_received_date: "", payment_amount: "" });
      setSelectedCOIds([]);
      setProgress({ percent: "", retainage: "", release: false });
    }
  }, [invoice, open]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invoices"] }); toast.success("Invoice created"); onClose(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invoices"] }); toast.success("Invoice updated"); onClose(); },
  });

  const jobCOs = changeOrders.filter(co => co.job_id === form.job_id && co.status === "approved");
  const selectedJob = jobs.find(j => j.id === form.job_id);

  const selectedCOs = changeOrders.filter(co => selectedCOIds.includes(co.id));
  const contract = selectedJob?.contract_value || selectedJob?.contract_price || 0;
  const otherJobInvoices = invoices.filter(inv => inv.job_id === form.job_id && inv.id !== invoice?.id);
  // Drafts count toward billed % (blocks double-billing) but not toward retainage actually held.
  const billedPct = otherJobInvoices
    .flatMap(inv => inv.line_items || [])
    .reduce((s, i) => s + (i.kind === "progress" ? (i.percent || 0) : 0), 0);
  const remainingPct = Math.max(0, 100 - billedPct);
  const pct = Math.min(remainingPct, Math.max(0, parseFloat(progress.percent) || 0));
  const retPct = Math.min(100, Math.max(0, parseFloat(progress.retainage) || 0));
  const progressAmount = money(contract * pct / 100);
  const coAmount = selectedCOs.reduce((s, co) => s + preTax(co), 0);
  const subtotal = money(progressAmount + coAmount);
  const retainageAmount = money(subtotal * retPct / 100);
  // Retainage still held on this job = withheld minus released, across the job's other non-draft invoices.
  const retainageHeld = money(otherJobInvoices
    .filter(inv => inv.status !== "draft")
    .flatMap(inv => inv.line_items || [])
    .reduce((s, i) => s + (i.kind === "retainage" || i.kind === "retainage_release" ? -(i.amount || 0) : 0), 0));
  const releaseAmount = progress.release ? retainageHeld : 0;
  const taxAmount = money(selectedCOs.reduce((s, co) => s + (co.tax_amount || 0), 0));
  const total = money(subtotal - retainageAmount + releaseAmount + taxAmount);

  const toggleCO = (id) => {
    setSelectedCOIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      change_order_ids: selectedCOIds,
      subtotal,
      tax_amount: taxAmount,
      total_amount: total,
      client_name: selectedJob?.client_name || "",
      job_name: selectedJob?.job_name || "",
      line_items: [
        ...(pct ? [{ kind: "progress", percent: pct, description: `Progress billing — ${pct}% of $${contract.toLocaleString()} contract`, amount: progressAmount }] : []),
        ...selectedCOs.map(co => ({ kind: "change_order", description: co.description, amount: money(preTax(co)) })),
        ...(taxAmount ? [{ kind: "tax", description: "Sales tax", amount: taxAmount }] : []),
        ...(retPct ? [{ kind: "retainage", percent: retPct, description: `Retainage withheld (${retPct}%)`, amount: -retainageAmount }] : []),
        ...(releaseAmount ? [{ kind: "retainage_release", description: "Retainage released", amount: releaseAmount }] : []),
      ],
    };
    if (invoice) {
      updateMutation.mutate({ id: invoice.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{invoice ? "Edit Invoice" : "New Invoice"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs text-slate-500">Job *</Label>
            <Select value={form.job_id} onValueChange={v => { setForm(p => ({ ...p, job_id: v })); setSelectedCOIds([]); }}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select job" /></SelectTrigger>
              <SelectContent>{jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.job_name}{j.client_name ? ` — ${j.client_name}` : ""}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Invoice Number</Label>
              <Input value={form.invoice_number} onChange={f("invoice_number")} className="mt-1" placeholder="Auto-generated if blank" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Due Date</Label>
              <Input type="date" value={form.due_date} onChange={f("due_date")} className="mt-1" />
            </div>
          </div>

          {form.job_id && jobCOs.length > 0 && (
            <div>
              <Label className="text-xs text-slate-500 block mb-2">Include Approved Change Orders</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-3">
                {jobCOs.map(co => (
                  <div key={co.id} className="flex items-center gap-3">
                    <Checkbox
                      id={`co-${co.id}`}
                      checked={selectedCOIds.includes(co.id)}
                      onCheckedChange={() => toggleCO(co.id)}
                    />
                    <label htmlFor={`co-${co.id}`} className="flex-1 text-sm cursor-pointer">
                      <span className="font-medium text-slate-800">{co.description}</span>
                      <span className="text-slate-400 ml-2">${preTax(co).toLocaleString()}{co.tax_amount ? ` + $${co.tax_amount.toLocaleString()} tax` : ""}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {form.job_id && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-500">Progress bill (% of contract)</Label>
                <Input type="number" step="0.1" min="0" max="100" value={progress.percent} onChange={e => setProgress(p => ({ ...p, percent: e.target.value }))} className="mt-1" placeholder="e.g. 30" />
                <p className="text-[11px] text-slate-400 mt-1">{billedPct}% billed on earlier invoices{parseFloat(progress.percent) > remainingPct ? ` — capped at ${remainingPct}%` : ""}</p>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Retainage withheld (%)</Label>
                <Input type="number" step="0.1" min="0" max="100" value={progress.retainage} onChange={e => setProgress(p => ({ ...p, retainage: e.target.value }))} className="mt-1" placeholder="e.g. 10" />
              </div>
              {retainageHeld > 0 && (
                <div className="col-span-2 flex items-center gap-2">
                  <Checkbox id="release-ret" checked={progress.release} onCheckedChange={v => setProgress(p => ({ ...p, release: !!v }))} />
                  <label htmlFor="release-ret" className="text-sm cursor-pointer">Release ${retainageHeld.toLocaleString()} retainage held on this job</label>
                </div>
              )}
            </div>
          )}

          {form.job_id && jobCOs.length === 0 && (
            <p className="text-xs text-slate-400 bg-slate-50 rounded-lg p-3">No approved change orders for this job yet.</p>
          )}

          {total !== 0 && (
            <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>${subtotal.toLocaleString()}</span></div>
              {retainageAmount > 0 && <div className="flex justify-between text-slate-500"><span>Retainage withheld</span><span>−${retainageAmount.toLocaleString()}</span></div>}
              {releaseAmount > 0 && <div className="flex justify-between text-slate-500"><span>Retainage released</span><span>${releaseAmount.toLocaleString()}</span></div>}
              {taxAmount > 0 && <div className="flex justify-between text-slate-500"><span>Sales tax</span><span>${taxAmount.toLocaleString()}</span></div>}
              <div className="flex justify-between font-semibold text-slate-900 border-t border-slate-200 pt-1"><span>Total</span><span>${total.toLocaleString()}</span></div>
            </div>
          )}

          <div>
            <Label className="text-xs text-slate-500">Notes</Label>
            <Input value={form.notes} onChange={f("notes")} className="mt-1" placeholder="Payment terms, instructions..." />
          </div>

          {(form.status === "sent" || form.status === "paid" || form.status === "overdue") && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg">
              <div>
                <Label className="text-xs text-slate-500">Sent Date</Label>
                <Input type="date" value={form.sent_date} onChange={f("sent_date")} className="mt-1" />
              </div>
              {form.status === "paid" && (
                <>
                  <div>
                    <Label className="text-xs text-slate-500">Payment Received</Label>
                    <Input type="date" value={form.payment_received_date} onChange={f("payment_received_date")} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Payment Amount ($)</Label>
                    <Input type="number" step="0.01" value={form.payment_amount} onChange={f("payment_amount")} className="mt-1" placeholder="0.00" />
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isPending || !form.job_id || (!invoice && total <= 0)}>
              {isPending ? "Saving..." : invoice ? "Update Invoice" : "Create Invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}