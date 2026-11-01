import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { AlertTriangle, CheckCircle, TrendingDown } from "lucide-react";

function fmt(n) { return `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; }
function pct(n) { return `${(n || 0).toFixed(1)}%`; }

export default function StressTestPanel({ estimate }) {
  const [laborOverrun, setLaborOverrun] = useState(15);
  const [materialIncrease, setMaterialIncrease] = useState(10);
  const [subIncrease, setSubIncrease] = useState(10);

  const { contract_price = 0, estimated_labor_cost = 0, estimated_material_cost = 0,
    estimated_subcontractor_cost = 0, estimated_overhead = 0 } = estimate;

  const base_cost = estimated_labor_cost + estimated_material_cost + estimated_subcontractor_cost + estimated_overhead;
  const base_margin = contract_price > 0 ? ((contract_price - base_cost) / contract_price) * 100 : 0;

  const stress_labor = estimated_labor_cost * (1 + laborOverrun / 100);
  const stress_material = estimated_material_cost * (1 + materialIncrease / 100);
  const stress_sub = estimated_subcontractor_cost * (1 + subIncrease / 100);
  const stress_total = stress_labor + stress_material + stress_sub + estimated_overhead;
  const stress_margin = contract_price > 0 ? ((contract_price - stress_total) / contract_price) * 100 : 0;

  const risk_level = stress_margin < 5 ? "High Risk" : stress_margin < 10 ? "Moderate Risk" : "Low Risk";
  const riskColor = risk_level === "High Risk" ? "text-red-600 bg-red-50 border-red-200"
    : risk_level === "Moderate Risk" ? "text-amber-600 bg-amber-50 border-amber-200"
    : "text-emerald-600 bg-emerald-50 border-emerald-200";
  const RiskIcon = risk_level === "Low Risk" ? CheckCircle : AlertTriangle;

  return (
    <div className="space-y-6">
      {/* Sliders */}
      <div className="space-y-5">
        <SliderRow label="Labor Overrun" value={laborOverrun} onChange={setLaborOverrun} />
        <SliderRow label="Material Cost Increase" value={materialIncrease} onChange={setMaterialIncrease} />
        <SliderRow label="Subcontractor Increase" value={subIncrease} onChange={setSubIncrease} />
      </div>

      {/* Results */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Base Margin" value={pct(base_margin)} sub={fmt(contract_price - base_cost)} color="text-slate-900" />
        <MetricCard label="Worst-Case Margin" value={pct(stress_margin)} sub={fmt(contract_price - stress_total)} color={stress_margin < 5 ? "text-red-600" : stress_margin < 10 ? "text-amber-600" : "text-emerald-600"} />
        <div className={`rounded-xl border p-4 flex flex-col items-center justify-center text-center ${riskColor}`}>
          <RiskIcon className="w-5 h-5 mb-1" />
          <p className="text-xs font-medium text-slate-500 mb-0.5">Risk Level</p>
          <p className="font-bold text-sm">{risk_level}</p>
        </div>
      </div>

      {/* Cost breakdown */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
        <p className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><TrendingDown className="w-4 h-4" />Stress Cost Breakdown</p>
        <Row label="Labor" base={fmt(estimated_labor_cost)} stress={fmt(stress_labor)} />
        <Row label="Materials" base={fmt(estimated_material_cost)} stress={fmt(stress_material)} />
        <Row label="Subcontractors" base={fmt(estimated_subcontractor_cost)} stress={fmt(stress_sub)} />
        <Row label="Overhead" base={fmt(estimated_overhead)} stress={fmt(estimated_overhead)} />
        <div className="border-t pt-2 mt-2">
          <Row label="Total" base={fmt(base_cost)} stress={fmt(stress_total)} bold />
        </div>
      </div>
    </div>
  );
}

function SliderRow({ label, value, onChange }) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-bold text-blue-600">{value}%</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={0} max={50} step={1} className="w-full" />
    </div>
  );
}

function MetricCard({ label, value, sub, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub} profit</p>
    </div>
  );
}

function Row({ label, base, stress, bold }) {
  return (
    <div className={`flex justify-between text-slate-600 ${bold ? "font-semibold text-slate-900" : ""}`}>
      <span>{label}</span>
      <span className="flex gap-6">
        <span className="text-slate-400 w-20 text-right">{base}</span>
        <span className="w-20 text-right">{stress}</span>
      </span>
    </div>
  );
}