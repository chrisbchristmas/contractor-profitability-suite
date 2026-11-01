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

export default function InvoiceDialog({ open, onClose, invoice, jobs, changeOrders, queryClient }) {
  const [form, setForm] = useState({ job_id: "", invoice_number: "", due_date: "", notes: "", status: "draft", sent_date: "", payment_received_date: "", payment_amount: "" });
  const [selectedCOIds, setSelectedCOIds] = useState([]);

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
    } else {
      setForm({ job_id: "", invoice_number: "", due_date: "", notes: "", status: "draft", sent_date: "", payment_received_date: "", payment_amount: "" });
      setSelectedCOIds([]);
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
  const subtotal = selectedCOs.reduce((s, co) => s + (co.final_price_to_client || co.sell_price || 0), 0);
  const taxAmount = selectedCOs.reduce((s, co) => s + (co.tax_amount || 0), 0);
  const total = subtotal;

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
      line_items: selectedCOs.map(co => ({ description: co.description, amount: co.final_price_to_client || co.sell_price || 0 })),
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
                      <span className="text-slate-400 ml-2">${(co.final_price_to_client || co.sell_price || 0).toLocaleString()}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {form.job_id && jobCOs.length === 0 && (
            <p className="text-xs text-slate-400 bg-slate-50 rounded-lg p-3">No approved change orders for this job yet.</p>
          )}

          {selectedCOIds.length > 0 && (
            <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>${subtotal.toLocaleString()}</span></div>
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
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isPending || !form.job_id}>
              {isPending ? "Saving..." : invoice ? "Update Invoice" : "Create Invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}