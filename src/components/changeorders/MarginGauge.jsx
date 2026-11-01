import React from "react";
import { cn } from "@/lib/utils";

export default function MarginGauge({ trueMargin, targetMargin }) {
  const capped = Math.min(Math.max(trueMargin, 0), 60); // display range 0–60%
  const pct = (capped / 60) * 100;
  const ok = trueMargin >= targetMargin;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-slate-500">True Margin</span>
        <span className={cn("text-2xl font-bold tabular-nums", ok ? "text-emerald-600" : "text-red-600")}>
          {trueMargin.toFixed(1)}%
        </span>
      </div>
      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", ok ? "bg-emerald-500" : "bg-red-500")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>0%</span>
        <span className="text-slate-500">Target: <strong className="text-slate-700">{targetMargin}%</strong></span>
        <span>60%</span>
      </div>
    </div>
  );
}