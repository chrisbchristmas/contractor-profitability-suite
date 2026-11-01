import React from "react";
import { Link } from "react-router-dom";
import { Shield, CheckCircle, ArrowRight, Minus, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import SeoMeta from "@/components/seo/SeoMeta";
import SiteFooter from "@/components/marketing/SiteFooter";
import { safeJsonLd } from "@/utils/safeJsonLd";

// Canonical feature rows. CPS answers are fixed (our differentiators);
// competitor answers are passed in per page.
const FEATURES = [
  {
    id: "job_costing_depth",
    label: "Job costing depth",
    cps: "Per-job cost tracking with burdened labor, materials, subs, equipment, overhead, and live variance vs. estimate.",
  },
  {
    id: "change_order_tracking",
    label: "Change order tracking",
    cps: "Full change-order lifecycle with built-in burden, markup, overhead, tax, e-signature approval, and per-CO profit tracking.",
  },
  {
    id: "profit_leakage",
    label: "Profit leakage detection",
    cps: "Automatic flags for missing burden, low markup, margin below target, and category variance over estimate.",
  },
  {
    id: "pricing_model_analysis",
    label: "Pricing model analysis",
    cps: "Dedicated pricing-model analyzer and break-even tooling to validate margin before you quote.",
  },
  {
    id: "labor_burden",
    label: "Labor burden calculator",
    cps: "Purpose-built labor burden calculator (payroll tax + workers' comp + general liability + benefits).",
  },
  {
    id: "ease_of_setup",
    label: "Ease of setup",
    cps: "Built for profitability tracking — set up in minutes with no schedule/dispatch configuration.",
  },
  {
    id: "starting_price",
    label: "Starting price",
    cps: "$19/mo Starter · $39/mo Pro",
  },
];

const COMPARE_LINKS = [
  { slug: "jobber", name: "Jobber" },
  { slug: "housecall-pro", name: "Housecall Pro" },
  { slug: "quickbooks", name: "QuickBooks" },
  { slug: "buildertrend", name: "Buildertrend" },
  { slug: "knowify", name: "Knowify" },
  { slug: "contractor-foreman", name: "Contractor Foreman" },
  { slug: "procore", name: "Procore" },
  { slug: "servicetitan", name: "ServiceTitan" },
];

function CompetitorIcon({ level }) {
  if (level === "none") return <Minus className="h-4 w-4 text-slate-400 shrink-0" />;
  if (level === "partial") return <Circle className="h-4 w-4 text-amber-500 shrink-0" />;
  return <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />;
}

export default function ComparePage({
  competitor,
  slug,
  h1,
  metaTitle,
  metaDescription,
  intro,
  whenOtherBetter,
  competitorAnswers,
}) {
  const canonical = `${window.location.origin}/compare/${slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: metaTitle,
    description: metaDescription,
    url: canonical,
    about: { "@type": "SoftwareApplication", name: competitor },
    isPartOf: { "@type": "WebSite", name: "Contractor Profitability Suite" },
  };

  return (
    <div className="min-h-screen bg-white">
      <SeoMeta title={metaTitle} description={metaDescription} canonical={canonical} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      {/* Header */}
      <header className="border-b border-slate-100 sticky top-0 z-30 bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">Contractor Pro</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/pricing" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-slate-600">Pricing</Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Sign In <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero / Intro */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-10 sm:pb-14 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 border border-blue-100">
          Tool Comparison · 2026
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-5">
          {h1}
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">{intro}</p>
      </section>

      {/* Comparison Table */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-14 sm:pb-20">
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-4 px-4 sm:px-6 text-sm font-semibold text-slate-500 w-1/3">Feature</th>
                <th className="py-4 px-4 sm:px-6 text-sm font-bold text-slate-900">
                  Contractor Profitability Suite
                </th>
                <th className="py-4 px-4 sm:px-6 text-sm font-bold text-slate-900">{competitor}</th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f, i) => {
                const ans = competitorAnswers[f.id] || { text: "—", level: "none" };
                const isPrice = f.id === "starting_price";
                return (
                  <tr key={f.id} className={i % 2 === 1 ? "bg-slate-50/40" : ""}>
                    <td className="py-4 px-4 sm:px-6 align-top text-sm font-medium text-slate-700 border-t border-slate-100">
                      {f.label}
                    </td>
                    <td className="py-4 px-4 sm:px-6 align-top border-t border-slate-100">
                      <div className="flex items-start gap-2">
                        {!isPrice && <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />}
                        <span className="text-sm text-slate-700 leading-relaxed">{f.cps}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 sm:px-6 align-top border-t border-slate-100">
                      <div className="flex items-start gap-2">
                        {!isPrice && <CompetitorIcon level={ans.level} />}
                        <span className="text-sm text-slate-600 leading-relaxed">{ans.text}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Honest "when the other tool fits better" */}
      <section className="bg-slate-50 border-y border-slate-100 py-14 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            When {competitor} might be the better fit
          </h2>
          <p className="text-slate-600 leading-relaxed">{whenOtherBetter}</p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-700 py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">See your true job margin before you sign</h2>
          <p className="text-slate-300 mb-8">
            Try the free job costing calculator, or start a 14-day trial. Plans from $19/month.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-blue-500 hover:bg-blue-400 px-8 text-base h-12 w-full sm:w-auto">
                Start Free Trial <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <Link to="/free-job-costing-calculator">
              <Button size="lg" variant="outline" className="px-8 text-base h-12 w-full sm:w-auto bg-white">
                Free Job Costing Calculator
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter activeSlug={slug} />
    </div>
  );
}