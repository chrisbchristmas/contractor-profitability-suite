import React from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import MarginGauge from "./MarginGauge";
import { cn } from "@/lib/utils";

const $ = (n) => `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function LiveCalcPanel({ calc, showFinancials = true }) {
  if (!calc) return null;
  return (
    <div className="space-y-5">
      {/* Margin gauge */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Live Margin</h4>
        <MarginGauge trueMargin={calc.true_margin_percent} targetMargin={calc.target_margin} />
      </div>

      {/* Price breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Price Breakdown</h4>
        {showFinancials ? (
          <>
            <Row label="True Labor Cost" value={$(calc.true_labor_cost)} />
            {calc.burden_calculated && (
              <>
                <Row label="Burden / Hr" value={$(calc.burden_amount_per_hour)} />
                <Row label="Fully Loaded Rate" value={$(calc.fully_loaded_rate)} />
                <Row label="Total Labour Burden" value={$(calc.total_labor_burden_cost)} />
              </>
            )}
            <Row label="Subtotal (before OH)" value={$(calc.subtotal_before_overhead)} />
            <Row label={`Overhead (${calc.overheadUsed}%)`} value={$(calc.overhead_amount)} />
            <Row label="Total Cost" value={$(calc.total_cost)} bold />
            <div className="border-t border-slate-100 pt-3">
              <Row label={`Markup (${calc.markupUsed}%)`} value={$(calc.sell_price - calc.total_cost)} />
              <Row label="Sell Price" value={$(calc.sell_price)} bold />
              {calc.tax_amount > 0 && <Row label="Tax" value={$(calc.tax_amount)} />}
              <Row label="Final Client Price" value={$(calc.final_price_to_client)} highlight />
            </div>
          </>
        ) : (
          <Row label="Final Client Price" value={$(calc.final_price_to_client)} highlight />
        )}
      </div>

      {/* Leakage — Owner only */}
      {showFinancials && calc.leakage_amount > 0 ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-semibold text-red-700">Leakage Detected</span>
          </div>
          <p className="text-xs text-red-600">
            At target margin ({calc.target_margin}%), you should charge{" "}
            <strong>{$(calc.target_sell_price)}</strong>. Current price is{" "}
            <strong>{$(calc.sell_price)}</strong> — leaving{" "}
            <strong className="text-red-700">{$(calc.leakage_amount)}</strong> on the table.
          </p>
        </div>
      ) : showFinancials && calc.total_cost > 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <span className="text-sm text-emerald-700 font-medium">Margin meets target — no leakage</span>
        </div>
      ) : null}

      {/* 2️⃣ Smart Markup Recommendation */}
      {showFinancials && calc.required_markup_for_target > 0 && (
        <div className={`rounded-xl p-4 border text-xs ${calc.markup_recommendation_status === "Markup sufficient" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-blue-50 border-blue-200 text-blue-700"}`}>
          <p className="font-semibold mb-0.5">Markup Advisor</p>
          <p>{calc.markup_recommendation_status}</p>
        </div>
      )}

      {/* Flags */}
      {calc.flags?.length > 0 && (
        <div className="space-y-2">
          {calc.flags.map((f, i) => (
            <div key={i} className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">{f.flag_message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, bold, highlight }) {
  return (
    <div className="flex justify-between items-baseline py-0.5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={cn(
        "text-sm tabular-nums",
        highlight ? "font-bold text-blue-600" : bold ? "font-semibold text-slate-900" : "text-slate-700"
      )}>{value}</span>
    </div>
  );
}