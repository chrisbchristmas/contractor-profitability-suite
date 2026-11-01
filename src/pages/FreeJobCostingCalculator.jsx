import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Calculator, TrendingUp, ArrowRight, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { safeJsonLd } from "@/utils/safeJsonLd";
import LeadCapture from "@/components/leads/LeadCapture";

// ---------- helpers ----------
function fmt(n) {
  return (n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function pct(n) {
  return (n ?? 0).toFixed(1) + "%";
}

// ---------- input field ----------
function Field({ label, children, suffix }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        {suffix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
            {suffix}
          </span>
        )}
        {children}
      </div>
    </div>
  );
}

function num(s) {
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

// ---------- FAQ ----------
const FAQS = [
  {
    q: "What is job costing for contractors?",
    a: "Job costing is the process of tracking all costs — labor, materials, subcontractors, equipment, and overhead — against a specific job or project so you know exactly how much profit each job generates. For small contractors, accurate job costing is the difference between growing a profitable business and slowly leaking money on every project.",
  },
  {
    q: "How do I calculate labor burden rate?",
    a: "Labor burden is the additional cost on top of base wages. To calculate it, add your payroll taxes (FICA, FUTA, SUTA — typically 12%), workers' comp insurance (5–15% depending on trade), general liability insurance (3%), and benefits (health, PTO, retirement — around 5%). The total as a percentage of base wage is your labor burden rate. Multiply base wage × (1 + burden%) to get your fully loaded labor cost per hour.",
  },
  {
    q: "What is a good profit margin for a contractor?",
    a: "A healthy net profit margin for most contractors is 15–25%. Specialty trades like electrical and plumbing tend to run 20–30%, while general contracting and remodeling often land at 10–20%. Anything consistently below 10% suggests pricing, overhead allocation, or labor cost problems that need attention.",
  },
  {
    q: "What is the difference between markup and margin?",
    a: "Markup is profit expressed as a percentage of cost: (Price - Cost) / Cost. Margin is profit expressed as a percentage of the selling price: (Price - Cost) / Price. A 25% markup yields a 20% margin, not 25%. Confusing the two is one of the most common — and expensive — mistakes contractors make when pricing jobs and change orders.",
  },
];

// ---------- component ----------
export default function FreeJobCostingCalculator() {
  const [contractValue, setContractValue] = useState("25000");
  const [laborHours, setLaborHours] = useState("80");
  const [baseWage, setBaseWage] = useState("35");
  const [laborBurden, setLaborBurden] = useState("35");
  const [materialCost, setMaterialCost] = useState("5000");
  const [overhead, setOverhead] = useState("15");
  const [profitTarget, setProfitTarget] = useState("20");

  useEffect(() => {
    document.title = "Free Contractor Job Costing Calculator | Free Tool";
    return () => { document.title = "Contractor Profitability Suite"; };
  }, []);

  const results = useMemo(() => {
    const cv = num(contractValue);
    const hrs = num(laborHours);
    const wage = num(baseWage);
    const burden = num(laborBurden) / 100;
    const mat = num(materialCost);
    const oh = num(overhead) / 100;
    const target = num(profitTarget) / 100;

    const totalLaborCost = hrs * wage * (1 + burden);
    const totalCost = totalLaborCost + mat + (totalLaborCost + mat) * oh;
    const grossProfit = cv - totalCost;
    const grossMarginPct = cv > 0 ? (grossProfit / cv) * 100 : 0;
    const markupPct = totalCost > 0 ? (grossProfit / totalCost) * 100 : 0;

    const marginVsTarget = grossMarginPct - target * 100;
    let status = "red";
    if (marginVsTarget >= 0) status = "green";
    else if (marginVsTarget >= -5) status = "yellow";

    return { totalLaborCost, totalCost, grossProfit, grossMarginPct, markupPct, status, target: target * 100 };
  }, [contractValue, laborHours, baseWage, laborBurden, materialCost, overhead, profitTarget]);

  // Ensure this public page stays indexable
  useEffect(() => {
    // Remove any noindex robots meta that may have been injected
    const tags = document.querySelectorAll('meta[name="robots"]');
    tags.forEach((t) => {
      const c = t.getAttribute("content") || "";
      if (c.includes("noindex")) t.remove();
    });
  }, []);

  const statusConfig = {
    green: {
      label: "On Target",
      icon: CheckCircle,
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
      iconColor: "text-green-600",
    },
    yellow: {
      label: "Below Target",
      icon: AlertTriangle,
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      border: "border-yellow-200",
      iconColor: "text-yellow-600",
    },
    red: {
      label: "At Risk",
      icon: XCircle,
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
      iconColor: "text-red-600",
    },
  };
  const sc = statusConfig[results.status];
  const StatusIcon = sc.icon;

  const faqJsonLd = safeJsonLd({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-700 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">Contractor Profitability Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Free Contractor Job Costing Calculator
          </h1>
          <p className="mt-2 text-gray-600 text-base">Know your true job margin before you sign.</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Calculator */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-0">
            {/* Inputs */}
            <div className="p-6 sm:p-8 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Job Inputs</h2>
              <Field label="Contract Value" prefix="$">
                <input
                  type="number"
                  value={contractValue}
                  onChange={(e) => setContractValue(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="25000"
                  style={{ fontSize: "16px" }}
                />
              </Field>
              <Field label="Labor Hours" suffix="hrs">
                <input
                  type="number"
                  value={laborHours}
                  onChange={(e) => setLaborHours(e.target.value)}
                  className="w-full pl-12 pr-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="80"
                  style={{ fontSize: "16px" }}
                />
              </Field>
              <Field label="Base Hourly Wage" prefix="$">
                <input
                  type="number"
                  value={baseWage}
                  onChange={(e) => setBaseWage(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="35"
                  style={{ fontSize: "16px" }}
                />
              </Field>
              <Field label="Labor Burden %" suffix="%">
                <input
                  type="number"
                  value={laborBurden}
                  onChange={(e) => setLaborBurden(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="35"
                  style={{ fontSize: "16px" }}
                />
              </Field>
              <Field label="Material Cost" prefix="$">
                <input
                  type="number"
                  value={materialCost}
                  onChange={(e) => setMaterialCost(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5000"
                  style={{ fontSize: "16px" }}
                />
              </Field>
              <Field label="Overhead %" suffix="%">
                <input
                  type="number"
                  value={overhead}
                  onChange={(e) => setOverhead(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="15"
                  style={{ fontSize: "16px" }}
                />
              </Field>
              <Field label="Profit Target %" suffix="%">
                <input
                  type="number"
                  value={profitTarget}
                  onChange={(e) => setProfitTarget(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="20"
                  style={{ fontSize: "16px" }}
                />
              </Field>
            </div>

            {/* Outputs */}
            <div className="p-6 sm:p-8 bg-gray-50 border-t lg:border-t-0 lg:border-l border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Results</h2>

              {/* Status badge */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${sc.bg} ${sc.border} mb-6`}>
                <StatusIcon className={`w-4 h-4 ${sc.iconColor}`} />
                <span className={`text-sm font-semibold ${sc.text}`}>{sc.label}</span>
                <span className="text-xs text-gray-500 ml-1">
                  (target {pct(results.target)})
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Total Labor Cost</span>
                  <span className="font-semibold text-gray-900">${fmt(results.totalLaborCost)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Total Estimated Cost</span>
                  <span className="font-semibold text-gray-900">${fmt(results.totalCost)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Gross Profit</span>
                  <span className={`font-semibold ${results.grossProfit >= 0 ? "text-green-700" : "text-red-700"}`}>
                    ${fmt(results.grossProfit)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Gross Margin %</span>
                  <span className={`font-semibold ${results.grossMarginPct >= results.target ? "text-green-700" : "text-gray-900"}`}>
                    {pct(results.grossMarginPct)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Markup %</span>
                  <span className="font-semibold text-gray-900">{pct(results.markupPct)}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600">
                    Labor cost includes burdened rate: <strong>${fmt(num(baseWage) * (1 + num(laborBurden) / 100))}/hr</strong>.
                    Overhead is applied to labor + materials.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <LeadCapture
          source="free-job-costing-calculator"
          calcInputs={{ contract_value: contractValue, labor_hours: laborHours, base_wage: baseWage, labor_burden_percent: laborBurden, material_cost: materialCost, overhead_percent: overhead, profit_target_percent: profitTarget }}
          calcResult={{ total_labor_cost: results.totalLaborCost, total_cost: results.totalCost, gross_profit: results.grossProfit, gross_margin_percent: results.grossMarginPct, markup_percent: results.markupPct }}
        />

        {/* CTA */}
        <div className="mt-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl p-8 sm:p-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
            Ready to track every job automatically?
          </h2>
          <p className="text-blue-100 text-sm sm:text-base mb-6 max-w-lg mx-auto">
            Stop calculating job costs by hand. Contractor Profitability Suite tracks labor burden,
            change order margins, and profit leakage — automatically. Plans from $19/month.
          </p>
          <Link
            to="/billing"
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
          >
            Sign Up Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* FAQ */}
        <section className="mt-12">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ structured data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd }} />
      </main>

      <footer className="border-t bg-white mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center text-sm text-gray-500">
          <Link to="/free-change-order-calculator" className="text-blue-600 hover:underline">
            Free Change Order Profit Calculator
          </Link>
          <span className="mx-2">·</span>
          <Link to="/Resources" className="text-blue-600 hover:underline">
            Contractor Resources
          </Link>
        </div>
      </footer>
    </div>
  );
}