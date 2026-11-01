import { useState } from "react";
import { DollarSign, AlertTriangle, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function fmt(n) { return `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function pct(n) { return `${(n || 0).toFixed(2)}%`; }

export default function ProfitCalculators() {
  const [form, setForm] = useState({
    labor_hours: "", labor_rate: "", material_cost: "",
    subcontractor_cost: "", overhead_cost: "", target_margin_percent: "20", user_price: "",
  });

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const n = (k) => parseFloat(form[k]) || 0;

  const labor_cost = n("labor_hours") * n("labor_rate");
  const total_cost = labor_cost + n("material_cost") + n("subcontractor_cost") + n("overhead_cost");
  const target = n("target_margin_percent");
  const recommended_price = target < 100 && total_cost > 0 ? total_cost / (1 - target / 100) : 0;
  const expected_profit = recommended_price - total_cost;
  const expected_margin = recommended_price > 0 ? (expected_profit / recommended_price) * 100 : 0;
  const user_price = n("user_price");
  const underpriced = user_price > 0 && user_price < recommended_price;
  const hasResult = total_cost > 0 && recommended_price > 0;

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Profit-Optimized Pricing</h1>
        <p className="text-sm text-slate-500 mt-1">Calculate the minimum price to hit your target margin</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-slate-500">Labor Hours</Label>
            <Input type="number" step="0.5" value={form.labor_hours} onChange={e => f("labor_hours", e.target.value)} className="mt-1" placeholder="0" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Labor Rate ($/hr)</Label>
            <Input type="number" step="0.01" value={form.labor_rate} onChange={e => f("labor_rate", e.target.value)} className="mt-1" placeholder="0" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Material Cost ($)</Label>
            <Input type="number" step="0.01" value={form.material_cost} onChange={e => f("material_cost", e.target.value)} className="mt-1" placeholder="0" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Subcontractor Cost ($)</Label>
            <Input type="number" step="0.01" value={form.subcontractor_cost} onChange={e => f("subcontractor_cost", e.target.value)} className="mt-1" placeholder="0" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Overhead Cost ($)</Label>
            <Input type="number" step="0.01" value={form.overhead_cost} onChange={e => f("overhead_cost", e.target.value)} className="mt-1" placeholder="0" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Target Margin %</Label>
            <Input type="number" step="0.1" value={form.target_margin_percent} onChange={e => f("target_margin_percent", e.target.value)} className="mt-1" />
          </div>
        </div>
        <div>
          <Label className="text-xs text-slate-500">Your Quote Price (optional — for underpricing check)</Label>
          <Input type="number" step="0.01" value={form.user_price} onChange={e => f("user_price", e.target.value)} className="mt-1" placeholder="Enter your quote to check if it's profitable" />
        </div>
      </div>

      {hasResult && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ResultCard label="Total Job Cost" value={fmt(total_cost)} icon={DollarSign} iconColor="text-slate-500" />
            <ResultCard label="Recommended Price" value={fmt(recommended_price)} icon={DollarSign} iconColor="text-blue-500" highlight />
            <ResultCard label="Expected Profit" value={fmt(expected_profit)} icon={CheckCircle} iconColor="text-emerald-500" />
            <ResultCard label="Expected Margin" value={pct(expected_margin)} icon={CheckCircle} iconColor="text-emerald-500" />
          </div>

          {user_price > 0 && (
            <div className={`rounded-xl border p-4 flex items-start gap-3 ${underpriced ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
              {underpriced
                ? <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                : <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />}
              <div>
                <p className={`font-semibold text-sm ${underpriced ? "text-red-700" : "text-emerald-700"}`}>
                  {underpriced ? "Price below profitable threshold" : "Price meets profitability target"}
                </p>
                {underpriced && (
                  <p className="text-xs text-red-600 mt-0.5">
                    Your quote of {fmt(user_price)} is {fmt(recommended_price - user_price)} below the recommended price.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultCard({ label, value, icon: Icon, iconColor, highlight }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200"}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <p className="text-xs text-slate-500">{label}</p>
      </div>
      <p className={`text-xl font-bold ${highlight ? "text-blue-700" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}