import React from "react";
import { DollarSign } from "lucide-react";

const $ = (n) => `$${Math.round(n || 0).toLocaleString()}`;

export default function CashFlowCard({ upcoming14Days }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-2">
        <DollarSign className="h-4 w-4 text-emerald-500" />
        <h3 className="text-sm font-semibold text-slate-700">Cash Flow (Next 14 Days)</h3>
      </div>
      <p className="text-sm text-slate-600">
        <strong className="text-lg font-black text-emerald-600">{$(upcoming14Days)}</strong>{" "}
        expected in next 14 days.
      </p>
    </div>
  );
}