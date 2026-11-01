import React from "react";
import { Link } from "react-router-dom";
import { Shield, ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import SeoMeta from "@/components/seo/SeoMeta";
import SiteFooter from "@/components/marketing/SiteFooter";
import { safeJsonLd } from "@/utils/safeJsonLd";

export default function TradePage({
  trade,
  slug,
  icon: TradeIcon,
  intro,
  features,
  example,
  metaDescription,
}) {
  const h1 = `Job Costing & Change Order Software for ${trade} Contractors`;
  const metaTitle = `${h1} | Contractor Profitability Suite`;
  const canonical = `${window.location.origin}/for/${slug}`;
  const [menuOpen, setMenuOpen] = useState(false);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: metaTitle,
    description: metaDescription,
    url: canonical,
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
          <div className="hidden sm:flex items-center gap-3">
            <Link to="/calculators">
              <Button variant="ghost" size="sm" className="text-slate-600">Calculators</Button>
            </Link>
            <Link to="/pricing">
              <Button variant="ghost" size="sm" className="text-slate-600">Pricing</Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Sign In <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="sm:hidden p-2 text-slate-600">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="sm:hidden border-t border-slate-100 bg-white px-4 py-4 flex flex-col gap-2">
            <Link to="/calculators" onClick={() => setMenuOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start text-slate-600">Calculators</Button>
            </Link>
            <Link to="/pricing" onClick={() => setMenuOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start text-slate-600">Pricing</Button>
            </Link>
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">Sign In</Button>
            </Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-12 sm:pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 border border-blue-100">
          <TradeIcon className="h-3.5 w-3.5" /> For {trade} contractors
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-5">
          {h1}
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">{intro}</p>
      </section>

      {/* Feature blocks */}
      <section className="bg-slate-50 border-y border-slate-100 py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Worked margin example */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">What a typical leak looks like</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Plain math on one job, the kind most {trade} contractors absorb without noticing.</p>
        </div>
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <span className="font-semibold text-slate-900">The job</span>
            <span className="text-slate-500">{example.jobLabel}</span>
          </div>
          <div className="space-y-3">
            {example.rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-4">
                <span className="text-slate-600 text-sm">{r.label}</span>
                <span className="font-semibold text-red-600 shrink-0">{r.lost}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 mt-5 pt-4">
            <span className="font-bold text-slate-900">Total lost on this one job</span>
            <span className="font-bold text-red-600 text-xl">{example.total}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-slate-500 text-sm">One month of this software</span>
            <span className="font-semibold text-emerald-600">$19</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-700 py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Stop absorbing the losses. Price them.</h2>
          <p className="text-slate-300 mb-8">
            Try the free job costing calculator, or start a 14-day trial. Plans from $19/month, 30-day money-back guarantee.
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

      <SiteFooter />
    </div>
  );
}