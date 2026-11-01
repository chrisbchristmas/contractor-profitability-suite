import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, TrendingDown, RefreshCw, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { useCustomerAuth } from "@/lib/CustomerAuthContext";
import { getBurdenPercent } from "@/lib/laborBurden";
import { computeJobVariance, COST_CATEGORIES } from "@/lib/jobVariance";

const $ = (n) => `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const pct = (n) => `${(n || 0).toFixed(1)}%`;

export default function JobVariancePanel({ job, changeOrders, timeEntries, crewCosts, expenses }) {
  const { customer } = useCustomerAuth();
  const queryClient = useQueryClient();
  const [showEstimates, setShowEstimates] = useState(false);
  const [recalcLoading, setRecalcLoading] = useState(false);

  const burdenPercent = getBurdenPercent(job, customer);
  const thresholdPercent = (job?.variance_alert_threshold_percent != null
    ? job.variance_alert_threshold_percent
    : customer?.variance_alert_threshold_percent) ?? 8;

  const variance = useMemo(
    () => computeJobVariance(job, changeOrders, timeEntries, crewCosts, expenses, burdenPercent, thresholdPercent),
    [job, changeOrders, timeEntries, crewCosts, expenses, burdenPercent, thresholdPercent]
  );

  const worst = variance.alerts[0];
  const hasData = variance.totalActual > 0 || variance.totalEstimated > 0;

  const recalcMutation = useMutation({
    mutationFn: async () => {
      setRecalcLoading(true);
      try {
        await base44.functions.invoke("checkProfitLeakage", { job_id: job.id });
      } finally {
        setRecalcLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job", job.id] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Alerts refreshed");
    },
    onError: () => toast.error("Failed to refresh alerts"),
  });

  const saveEstimates = async (estimates) => {
    await base44.entities.Job.update(job.id, estimates);
    queryClient.invalidateQueries({ queryKey: ["job", job.id] });
    queryClient.invalidateQueries({ queryKey: ["jobs"] });
    setShowEstimates(false);
    toast.success("Estimates updated");
  };

  if (!hasData) {
    return (
      <div className="bg-card rounded-xl border border-dashed border-border p-5 mb-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <TrendingDown className="h-4 w-4" />
          <p className="text-sm">Set category estimates and log actual costs to track estimate-vs-actual variance.</p>
        </div>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowEstimates(true)}>
          <Pencil className="h-3.5 w-3.5 mr-1.5" /> Set Category Estimates
        </Button>
        {showEstimates && <EstimateEditor job={job} onClose={() => setShowEstimates(false)} onSave={saveEstimates} />}
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Variance banner */}
      {worst && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-red-200 bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-700">
              {worst.label} is tracking {Math.round(worst.overPct)}% over estimate
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Projected margin has dropped from {pct(variance.currentMargin)} to {pct(variance.projectedMargin)}
              {variance.jobPctComplete != null && <> · labor {Math.round(variance.jobPctComplete * 100)}% complete</>}.
            </p>
            {variance.alerts.length > 1 && (
              <p className="text-xs text-red-500 mt-1">
                Also over threshold: {variance.alerts.slice(1).map((a) => a.label).join(", ")}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" className="text-red-700 hover:bg-red-100 shrink-0" onClick={() => recalcMutation.mutate()} disabled={recalcLoading}>
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1", recalcLoading && "animate-spin")} /> Recalc
          </Button>
        </div>
      )}

      {/* Variance table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Estimate vs Actual</h3>
            <p className="text-xs text-muted-foreground">Threshold: {thresholdPercent}% · Burden: {burdenPercent}% on labor</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowEstimates(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit Estimates
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left font-semibold text-foreground px-4 py-2">Category</th>
                <th className="text-right font-semibold text-foreground px-4 py-2">Estimated</th>
                <th className="text-right font-semibold text-foreground px-4 py-2">Actual to Date</th>
                <th className="text-right font-semibold text-foreground px-4 py-2">Variance</th>
                <th className="text-right font-semibold text-foreground px-4 py-2">% Complete</th>
                <th className="text-right font-semibold text-foreground px-4 py-2">Projected Final</th>
              </tr>
            </thead>
            <tbody>
              {variance.categories.map((c) => (
                <tr key={c.key} className={cn("border-b border-border", c.isOver && "bg-red-50/50")}>
                  <td className="px-4 py-2 font-medium text-foreground">
                    {c.label}
                    {c.key === "labor" && c.laborRaw != null && (
                      <span className="block text-xs text-slate-400">Raw wage {$(c.laborRaw)}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{$(c.estimated)}</td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium text-foreground">{$(c.actual)}</td>
                  <td className={cn("px-4 py-2 text-right tabular-nums font-medium", c.estimated > 0 ? (c.isOver ? "text-red-600" : "text-emerald-600") : "text-slate-400")}>
                    {c.estimated > 0 ? `${c.overPct >= 0 ? "+" : ""}${c.overPct.toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                    {c.key === "labor" && variance.jobPctComplete != null ? `${Math.round(variance.jobPctComplete * 100)}%` : "—"}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums font-semibold text-foreground">{$(c.projected)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/30 border-t-2 border-border">
                <td className="px-4 py-2 font-semibold text-foreground">Total</td>
                <td className="px-4 py-2 text-right tabular-nums font-semibold text-muted-foreground">{$(variance.totalEstimated)}</td>
                <td className="px-4 py-2 text-right tabular-nums font-semibold text-foreground">{$(variance.totalActual)}</td>
                <td colSpan={2}></td>
                <td className="px-4 py-2 text-right tabular-nums font-bold text-blue-600">{$(variance.projectedTotalCost)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        {/* Projected margin math */}
        <div className="px-4 py-3 border-t border-border bg-slate-50">
          <p className="text-xs text-muted-foreground mb-1.5">Projected margin at current burn rate</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-400">Adj. Revenue</p>
              <p className="font-semibold text-foreground">{$(variance.adjustedRevenue)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Projected Final Cost</p>
              <p className="font-semibold text-foreground">{$(variance.projectedTotalCost)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Current Margin</p>
              <p className="font-semibold text-foreground">{pct(variance.currentMargin)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Projected Margin</p>
              <p className={cn("font-bold", variance.projectedMargin < (job?.target_margin_percent ?? 30) ? "text-red-600" : "text-emerald-600")}>
                {pct(variance.projectedMargin)}
              </p>
            </div>
          </div>
          {variance.jobPctComplete != null && variance.jobPctComplete < 1 && (
            <p className="text-xs text-slate-400 mt-2">
              Labor {Math.round(variance.jobPctComplete * 100)}% complete used as job-progress proxy; each category's actual-to-date is scaled by 1/{Math.round(variance.jobPctComplete * 100)} to project to completion.
            </p>
          )}
        </div>
      </div>

      {showEstimates && <EstimateEditor job={job} onClose={() => setShowEstimates(false)} onSave={saveEstimates} />}
    </div>
  );
}

function EstimateEditor({ job, onClose, onSave }) {
  const [form, setForm] = useState({
    estimated_labor_cost: job.estimated_labor_cost ?? "",
    estimated_material_cost: job.estimated_material_cost ?? "",
    estimated_subcontractor_cost: job.estimated_subcontractor_cost ?? "",
    estimated_equipment_cost: job.estimated_equipment_cost ?? "",
    estimated_labor_hours: job.estimated_labor_hours ?? "",
  });

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    onSave({
      estimated_labor_cost: parseFloat(form.estimated_labor_cost) || 0,
      estimated_material_cost: parseFloat(form.estimated_material_cost) || 0,
      estimated_subcontractor_cost: parseFloat(form.estimated_subcontractor_cost) || 0,
      estimated_equipment_cost: parseFloat(form.estimated_equipment_cost) || 0,
      estimated_labor_hours: parseFloat(form.estimated_labor_hours) || 0,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Category Estimates</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label className="text-xs text-slate-500">Estimated Labor Cost (burdened)</Label>
            <Input type="number" step="0.01" value={form.estimated_labor_cost} onChange={f("estimated_labor_cost")} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Estimated Labor Hours</Label>
            <Input type="number" step="0.25" value={form.estimated_labor_hours} onChange={f("estimated_labor_hours")} className="mt-1" />
            <p className="text-xs text-slate-400 mt-1">Used to calculate labor % complete for projections.</p>
          </div>
          <div>
            <Label className="text-xs text-slate-500">Estimated Materials Cost</Label>
            <Input type="number" step="0.01" value={form.estimated_material_cost} onChange={f("estimated_material_cost")} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Estimated Subcontractor Cost</Label>
            <Input type="number" step="0.01" value={form.estimated_subcontractor_cost} onChange={f("estimated_subcontractor_cost")} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Estimated Equipment / Other Cost</Label>
            <Input type="number" step="0.01" value={form.estimated_equipment_cost} onChange={f("estimated_equipment_cost")} className="mt-1" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Save Estimates</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}