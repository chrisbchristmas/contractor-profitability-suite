import React from "react";
import { cn } from "@/lib/utils";
import { calculateJobDirectMetrics } from "@/components/changeorders/CalculationEngine";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

function fmt(n) {
  return (n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function pct(n) {
  return (n || 0).toFixed(1) + "%";
}

/**
 * Estimated vs Actual closeout scorecard for a completed/invoiced job.
 * Health badge: GREEN if actual margin within 2% of estimated,
 * YELLOW if 2-5% below estimated, RED if more than 5% below.
 */
export default function JobCloseoutScorecard({ job, changeOrders = [] }) {
  const contractValue = job.contract_value || job.contract_price || 0;
  const estLaborHours = job.estimated_labor_hours || job.total_estimated_hours || 0;
  const actLaborHours = job.actual_labor_hours || 0;
  const laborRate = job.labor_rate || 0;

  const estLaborCost = (estLaborHours * laborRate) || (job.estimated_cost || 0) * 0.5;
  const actLaborCost = actLaborHours * laborRate;

  const estMaterialCost = job.estimated_material_cost || 0;
  const actMaterialCost = job.material_cost || 0;

  const estTotalCost = job.estimated_cost || (estLaborCost + estMaterialCost + (job.subcontractor_cost || 0) + (job.overhead_cost || 0));
  const { totalCost: actTotalCost } = calculateJobDirectMetrics(job);

  const estMargin = contractValue > 0 ? ((contractValue - estTotalCost) / contractValue) * 100 : 0;
  const actMargin = contractValue > 0 ? ((contractValue - actTotalCost) / contractValue) * 100 : 0;

  const marginDelta = actMargin - estMargin;

  let health = "red";
  if (marginDelta >= -2) health = "green";
  else if (marginDelta >= -5) health = "yellow";

  const healthConfig = {
    green: { label: "On Track", icon: CheckCircle, bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", iconColor: "text-emerald-600" },
    yellow: { label: "Below Estimate", icon: AlertTriangle, bg: "bg-amber-50 border-amber-200", text: "text-amber-700", iconColor: "text-amber-600" },
    red: { label: "At Risk", icon: XCircle, bg: "bg-red-50 border-red-200", text: "text-red-700", iconColor: "text-red-600" },
  };
  const hc = healthConfig[health];
  const HealthIcon = hc.icon;

  const rows = [
    { label: "Labor Hours", est: estLaborHours ? `${estLaborHours} hrs` : "—", act: `${actLaborHours} hrs`, variance: estLaborHours > 0 ? `${((actLaborHours - estLaborHours)).toFixed(1)} hrs` : "—" },
    { label: "Labor Cost", est: `$${fmt(estLaborCost)}`, act: `$${fmt(actLaborCost)}`, variance: `$${fmt(actLaborCost - estLaborCost)}`, isCurrency: true },
    { label: "Material Cost", est: `$${fmt(estMaterialCost)}`, act: `$${fmt(actMaterialCost)}`, variance: `$${fmt(actMaterialCost - estMaterialCost)}`, isCurrency: true },
    { label: "Total Cost", est: `$${fmt(estTotalCost)}`, act: `$${fmt(actTotalCost)}`, variance: `$${fmt(actTotalCost - estTotalCost)}`, isCurrency: true },
    { label: "Gross Margin %", est: pct(estMargin), act: pct(actMargin), variance: `${marginDelta >= 0 ? "+" : ""}${marginDelta.toFixed(1)}%`, isMargin: true },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Closeout Scorecard</h2>
          <p className="text-xs text-muted-foreground">Estimated vs actual performance for this job.</p>
        </div>
        <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full border", hc.bg)}>
          <HealthIcon className={cn("h-4 w-4", hc.iconColor)} />
          <span className={cn("text-sm font-semibold", hc.text)}>{hc.label}</span>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Metric</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Estimated</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actual</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Variance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const varianceNum = r.isMargin ? marginDelta : null;
              const isNeg = r.isCurrency
                ? (parseFloat(r.variance.replace(/[^0-9.-]/g, "")) < 0)
                : r.isMargin ? marginDelta < 0 : false;
              const isPos = r.isCurrency
                ? (parseFloat(r.variance.replace(/[^0-9.-]/g, "")) > 0)
                : r.isMargin ? marginDelta > 0 : false;
              return (
                <tr key={i} className={cn("border-b border-border last:border-0", i % 2 === 1 && "bg-muted/20")}>
                  <td className="px-4 py-3 font-medium text-foreground">{r.label}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{r.est}</td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">{r.act}</td>
                  <td className={cn(
                    "px-4 py-3 text-right font-semibold",
                    r.isMargin && isNeg ? "text-red-600" : r.isMargin && isPos ? "text-emerald-600" : "text-foreground"
                  )}>
                    {r.variance}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}