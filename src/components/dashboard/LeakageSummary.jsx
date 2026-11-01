import React from "react";
import { AlertTriangle } from "lucide-react";

export default function LeakageSummary({ leakageFlags, changeOrders }) {
  if (!leakageFlags?.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Leakage Alerts</h3>
        <div className="text-center py-8">
          <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
            <span className="text-lg">✓</span>
          </div>
          <p className="text-sm text-slate-500">No leakage detected</p>
        </div>
      </div>
    );
  }

  const grouped = {};
  leakageFlags.forEach(f => {
    if (!grouped[f.flag_type]) grouped[f.flag_type] = [];
    grouped[f.flag_type].push(f);
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Leakage Alerts</h3>
      <div className="space-y-3">
        {Object.entries(grouped).map(([type, flags]) => (
          <div key={type} className="flex items-start gap-3 p-3 bg-amber-50/50 border border-amber-100 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                {type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
              </p>
              <p className="text-xs text-amber-600 mt-0.5">{flags.length} change order{flags.length > 1 ? "s" : ""} affected</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}