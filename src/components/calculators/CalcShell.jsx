import React from "react";

export default function CalcShell({ title, desc, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-1">{title}</h2>
      {desc && <p className="text-slate-500 text-sm mb-6">{desc}</p>}
      {children}
    </div>
  );
}

export function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

export function Results({ rows }) {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-100">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-slate-600">{r.label}</span>
          <span className={`font-bold text-lg ${r.highlight ? "text-blue-600" : r.warn ? "text-amber-600" : r.good ? "text-green-600" : "text-slate-900"}`}>
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}