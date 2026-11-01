import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, ArrowRight, AlertTriangle, Pencil, Check, X } from "lucide-react";

const $ = (n) =>
  `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const pct = (n) => `${(n || 0).toFixed(1)}%`;

/**
 * One WIP table row + expandable math detail + inline % complete override.
 */
export default function WipRow({ row, burdenPercent, onOverride }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(
    row.has_override ? String(row.pct_complete) : ""
  );

  const underbilled = row.is_underbilled;
  const overbilled = row.is_overbilled;

  const saveOverride = () => {
    const v = parseFloat(draft);
    if (!Number.isNaN(v) && v >= 0 && v <= 100) {
      onOverride(row.id, v);
    }
    setEditing(false);
  };

  const clearOverride = () => {
    setDraft("");
    onOverride(row.id, null);
    setEditing(false);
  };

  return (
    <>
      <tr
        className={cn(
          "border-b border-border transition-colors cursor-pointer",
          underbilled ? "bg-amber-50/60 hover:bg-amber-100/60" : "hover:bg-muted/30",
          overbilled && !underbilled && "bg-blue-50/40"
        )}
        onClick={() => setExpanded((e) => !e)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            )}
            <Link
              to={`${createPageUrl("JobDetail")}?id=${row.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-blue-600 hover:underline font-medium flex items-center gap-1"
            >
              {row.job_name}
              <ArrowRight className="h-3 w-3 opacity-50" />
            </Link>
          </div>
        </td>
        <td className="px-4 py-3 text-right tabular-nums">{$(row.contract_value)}</td>
        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
          {$(row.estimated_total_cost)}
        </td>
        <td className="px-4 py-3 text-right tabular-nums">{$(row.actual_cost_to_date)}</td>
        <td className="px-4 py-3 text-right tabular-nums" onClick={(e) => e.stopPropagation()}>
          {editing ? (
            <div className="flex items-center justify-end gap-1">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveOverride()}
                className="w-16 h-7 px-1.5 text-right border border-border rounded text-xs"
                autoFocus
              />
              <button onClick={saveOverride} className="text-emerald-600 hover:text-emerald-700" title="Save">
                <Check className="h-3.5 w-3.5" />
              </button>
              {row.has_override && (
                <button onClick={clearOverride} className="text-muted-foreground hover:text-foreground" title="Clear override">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                setDraft(row.has_override ? String(row.pct_complete) : "");
                setEditing(true);
              }}
              className="group flex items-center justify-end gap-1.5 ml-auto"
              title={row.pct_source === "manual" ? "Manual override — click to edit" : "Cost-to-cost — click to override"}
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full",
                    row.pct_complete >= 100 ? "bg-emerald-500" : "bg-blue-500"
                  )}
                  style={{ width: `${Math.min(row.pct_complete, 100)}%` }}
                />
              </div>
              <span className="w-11 text-right">{pct(row.pct_complete)}</span>
              {row.has_override ? (
                <span className="text-[10px] font-bold text-amber-600 leading-none" title="Manual override">M</span>
              ) : (
                <Pencil className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground" />
              )}
            </button>
          )}
        </td>
        <td className="px-4 py-3 text-right tabular-nums text-blue-600">{$(row.earned_revenue)}</td>
        <td className="px-4 py-3 text-right tabular-nums">{$(row.billed_to_date)}</td>
        <td
          className={cn(
            "px-4 py-3 text-right tabular-nums font-semibold",
            underbilled ? "text-red-600" : overbilled ? "text-blue-600" : "text-emerald-600"
          )}
        >
          {row.over_under_billed < 0 ? "(" : ""}
          {$(Math.abs(row.over_under_billed))}
          {row.over_under_billed < 0 ? ")" : ""}
        </td>
      </tr>

      {/* Underbilled actionable callout */}
      {underbilled && !expanded && (
        <tr className="bg-amber-50/40">
          <td colSpan={8} className="px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-amber-800">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>
                You've earned <strong>{$(Math.abs(row.over_under_billed))}</strong> you haven't billed
                yet on this job — consider invoicing.
              </span>
            </div>
          </td>
        </tr>
      )}

      {/* Expandable math detail */}
      {expanded && (
        <tr className="bg-muted/30">
          <td colSpan={8} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <div className="font-semibold text-foreground mb-1">Contract Value</div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Base contract</span>
                  <span className="tabular-nums">{$(row.contract_value - row.co_revenue)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Approved change orders</span>
                  <span className="tabular-nums">+{$(row.co_revenue)}</span>
                </div>
                <div className="flex justify-between font-medium text-foreground border-t border-border pt-1">
                  <span>Total contract value</span>
                  <span className="tabular-nums">{$(row.contract_value)}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-semibold text-foreground mb-1">Cost to Date (burdened labor @ {burdenPercent}%)</div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Labor (burdened)</span>
                  <span className="tabular-nums">{$(row.breakdown.labor)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Materials</span>
                  <span className="tabular-nums">{$(row.breakdown.materials)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Subcontractor</span>
                  <span className="tabular-nums">{$(row.breakdown.subcontractor)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Equipment / Other</span>
                  <span className="tabular-nums">{$(row.breakdown.equipment_other)}</span>
                </div>
                <div className="flex justify-between font-medium text-foreground border-t border-border pt-1">
                  <span>Total actual cost</span>
                  <span className="tabular-nums">{$(row.actual_cost_to_date)}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-semibold text-foreground mb-1">WIP Math</div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Est. total cost (incl. COs)</span>
                  <span className="tabular-nums">{$(row.estimated_total_cost)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>% complete ({row.pct_source === "manual" ? "manual" : "cost ÷ est"})</span>
                  <span className="tabular-nums">{pct(row.pct_complete)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Earned = % × contract</span>
                  <span className="tabular-nums">{$(row.earned_revenue)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Billed to date</span>
                  <span className="tabular-nums">{$(row.billed_to_date)}</span>
                </div>
                <div className={cn("flex justify-between font-medium border-t border-border pt-1", underbilled ? "text-red-600" : overbilled ? "text-blue-600" : "text-emerald-600")}>
                  <span>Position = billed − earned</span>
                  <span className="tabular-nums">
                    {row.over_under_billed < 0 ? "(" : ""}
                    {$(Math.abs(row.over_under_billed))}
                    {row.over_under_billed < 0 ? ")" : ""}
                  </span>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}