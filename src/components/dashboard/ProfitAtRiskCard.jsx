import React from "react";
import { AlertTriangle } from "lucide-react";

const $ = (n) => `$${Math.round(n || 0).toLocaleString()}`;

export default function ProfitAtRiskCard({ profitAtRisk }) {
  return (
    <div className={`rounded-xl border p-5 ${profitAtRisk > 0 ? "bg-red-50 border-red-200" : "bg-white border-slate-200"}`}>
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className={`h-4 w-4 ${profitAtRisk > 0 ? "text-red-500" : "text-slate-400"}`} />
        <h3 className="text-sm font-semibold text-slate-700">Profit at Risk</h3>
      </div>
      {profitAtRisk > 0 ? (
        <p className="text-sm text-red-700">
          <strong className="text-lg font-black">{$(profitAtRisk)}</strong> in underpriced drafts.
        </p>
      ) : (
        <p className="text-sm text-slate-400">No underpriced draft change orders.</p>
      )}
    </div>
  );
}