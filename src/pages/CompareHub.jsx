import React from "react";
import { Link } from "react-router-dom";
import { Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SeoMeta from "@/components/seo/SeoMeta";
import SiteFooter, { COMPARE_PAGES } from "@/components/marketing/SiteFooter";
import { safeJsonLd } from "@/utils/safeJsonLd";

const META = {
  jobber: "Field service management built around scheduling, dispatch, and CRM.",
  "housecall-pro": "Field service and marketing platform for home service businesses.",
  quickbooks: "Accounting software that tracks money, not per-job margin.",
  buildertrend: "Full construction management suite for builders, about $499+/mo.",
  knowify: "Job costing with tight QuickBooks sync, about $99+/mo.",
  "contractor-foreman": "Affordable all-in-one project management, about $49+/mo.",
  procore: "Enterprise construction management for large GCs, custom pricing.",
  servicetitan: "Enterprise field service for home services, custom pricing.",
};

export default function CompareHub() {
  const title = "Compare Contractor Profitability Suite to 8 Contractor Tools";
  const description = "Side-by-side comparisons of Contractor Profitability Suite vs Jobber, Housecall Pro, QuickBooks, Buildertrend, Knowify, Contractor Foreman, Procore, and ServiceTitan.";
  const canonical = `${window.location.origin}/compare`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: canonical,
    isPartOf: { "@type": "WebSite", name: "Contractor Profitability Suite" },
  };

  return (
    <div className="min-h-screen bg-white">
      <SeoMeta title={title} description={description} canonical={canonical} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <header className="border-b border-slate-100 sticky top-0 z-30 bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">Contractor Pro</span>
          </Link>
          <Link to="/login">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              Sign In <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 border border-blue-100">
          Tool Comparison · 2026
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-5">
          How Contractor Profitability Suite compares
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Honest, feature-by-feature comparisons with the tools contractors use most. CPS is a focused margin-tracking layer for 1-10 person contractors — not another all-in-one suite.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {COMPARE_PAGES.map((c) => (
            <Link key={c.slug} to={`/compare/${c.slug}`}>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow h-full flex flex-col">
                <h2 className="font-semibold text-slate-900 mb-2">Contractor Profitability Suite vs {c.name}</h2>
                <p className="text-sm text-slate-500 leading-relaxed flex-1">{META[c.slug]}</p>
                <span className="text-sm text-blue-600 font-medium mt-4 inline-flex items-center gap-1">
                  See the comparison <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}