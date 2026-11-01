import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import MarkupMarginCalc from "@/components/calculators/MarkupMarginCalc";
import LaborBurdenCalc from "@/components/calculators/LaborBurdenCalc";
import JobProfitCalc from "@/components/calculators/JobProfitCalc";
import OverheadCalc from "@/components/calculators/OverheadCalc";
import ChangeOrderCalc from "@/components/calculators/ChangeOrderCalc";
import BreakEvenCalc from "@/components/calculators/BreakEvenCalc";
import HourlyRateCalc from "@/components/calculators/HourlyRateCalc";
import MaterialMarkupCalc from "@/components/calculators/MaterialMarkupCalc";
import SubcontractorCalc from "@/components/calculators/SubcontractorCalc";
import CashFlowCalc from "@/components/calculators/CashFlowCalc";
import ProfitPricingCalc from "@/components/calculators/ProfitPricingCalc";
import PricingModelAnalyser from "@/components/calculators/PricingModelAnalyser";

const calculators = [
  { id: "pricing", label: "Profit-Optimized Pricing", component: ProfitPricingCalc },
  { id: "markup", label: "Markup vs Margin", component: MarkupMarginCalc },
  { id: "labor", label: "Labor Burden", component: LaborBurdenCalc },
  { id: "job", label: "Job Profit", component: JobProfitCalc },
  { id: "overhead", label: "Overhead Allocation", component: OverheadCalc },
  { id: "changeorder", label: "Change Order", component: ChangeOrderCalc },
  { id: "breakeven", label: "Break-Even", component: BreakEvenCalc },
  { id: "hourly", label: "Hourly Rate", component: HourlyRateCalc },
  { id: "material", label: "Material Markup", component: MaterialMarkupCalc },
  { id: "sub", label: "Subcontractor", component: SubcontractorCalc },
  { id: "cashflow", label: "Cash Flow", component: CashFlowCalc },
  { id: "pricingmodel", label: "Pricing Model Analyser", component: PricingModelAnalyser },
];

export default function CalculatorHub() {
  const [active, setActive] = useState("pricing");
  const ActiveCalc = calculators.find((c) => c.id === active)?.component;
  const activeLabel = calculators.find((c) => c.id === active)?.label;

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Calculators</h1>
        <p className="text-sm text-slate-500 mt-1">12 essential tools to protect your margins and price jobs correctly</p>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Sidebar tabs */}
        <aside className="lg:w-52 flex-shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {calculators.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`w-full text-left px-4 py-3 text-sm font-medium border-b border-slate-100 last:border-b-0 transition-colors min-h-[44px] ${
                  active === c.id
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {c.label}
              </button>
            ))}
            <Link
              to="/calculators/job-costing-calculator"
              className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm font-medium border-t border-slate-200 transition-colors min-h-[44px text-blue-700 hover:bg-blue-50"
            >
              Job Costing Calculator
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </aside>

        {/* Calculator panel */}
        <main className="flex-1 min-w-0">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-800">{activeLabel}</h2>
          </div>
          {ActiveCalc && <ActiveCalc />}
        </main>
      </div>
    </div>
  );
}