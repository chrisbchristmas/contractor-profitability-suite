import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Shield, TrendingUp, FileText, Clock, AlertTriangle,
  CheckCircle, ArrowRight, DollarSign, BarChart2, Layers, BookOpen, Menu, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSeoTitle } from "@/components/seo/SeoMeta";
import SiteFooter from "@/components/marketing/SiteFooter";
import { safeJsonLd } from "@/utils/safeJsonLd";

const features = [
  {
    icon: TrendingUp,
    title: "Real-Time Margin Tracking",
    desc: "See exactly where your profit stands on every job, every change order, in real time.",
  },
  {
    icon: AlertTriangle,
    title: "Leakage Detection",
    desc: "Automatically flag change orders with missing burden, low markup, or margin below target.",
  },
  {
    icon: FileText,
    title: "Change Order Engine",
    desc: "Build accurate COs with built-in labor burden, overhead, markup, and tax calculations.",
  },
  {
    icon: Clock,
    title: "Time Tracking",
    desc: "Log hours per job and change order to compare estimated vs. actual labor efficiency.",
  },
  {
    icon: BarChart2,
    title: "Profit Pace & Cash Flow",
    desc: "Forecast upcoming collections and spot profit-at-risk before it's too late.",
  },
  {
    icon: Layers,
    title: "CO Templates & Presets",
    desc: "Save common change order types and cost presets to quote faster and more consistently.",
  },
];

const benefits = [
  "Stop leaving money on the table",
  "Quote change orders in minutes, not hours",
  "Know your true margin before you sign",
  "Catch missing overhead and burden automatically",
  "Track every dollar from contract to closeout",
];

const faqs = [
  {
    q: "Do I need a credit card to start?",
    a: "No. The 14-day free trial requires no credit card, and setup takes about 10 minutes.",
  },
  {
    q: "Does it replace QuickBooks?",
    a: "No. It sits beside it. QuickBooks tracks your money; CPS tracks your job margin: true cost, burdened labor, and change order profit per job.",
  },
  {
    q: "Will it work for my trade?",
    a: "Yes. HVAC, electrical, plumbing, roofing, remodeling, and general contracting crews use it daily.",
  },
  {
    q: "How long does setup take?",
    a: "About 10 minutes. Set your labor burden and markup defaults, add a job, and you are tracking real margin.",
  },
  {
    q: "Can my crew use it?",
    a: "Yes. The Pro plan includes team members, so your crew can log time and daily logs while you watch margins.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel anytime from your billing portal with no long-term contracts. There is also a 30-day money-back guarantee.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Contractor Profitability Suite",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://contractorprofitabilitysuite.com",
  offers: {
    "@type": "Offer",
    price: "19",
    priceCurrency: "USD",
  },
};

export default function AAppLanding() {
  useSeoTitle("Contractor Profitability Suite | Job Costing & Change Order Software for Small Contractors");
  const [articles, setArticles] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    base44.entities.SeoArticle.filter({ status: "published" }, "-publish_date", 6)
      .then(setArticles)
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(softwareJsonLd) }} />

      {/* Nav */}
      <header className="border-b border-slate-100 sticky top-0 z-30 bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">Contractor Pro</span>
          </div>
          {isMobile ? (
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-slate-600">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/calculators">
                <Button variant="ghost" size="sm" className="text-slate-600">Calculators</Button>
              </Link>
              <Link to={createPageUrl("Resources")}>
                <Button variant="ghost" size="sm" className="text-slate-600">Resources</Button>
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
          )}
        </div>
        {/* Mobile Menu Dropdown */}
        {isMobile && menuOpen && (
          <div className="border-t border-slate-100 bg-white px-4 py-4 flex flex-col gap-2">
            <Link to="/calculators" onClick={() => setMenuOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start text-slate-600">Calculators</Button>
            </Link>
            <Link to={createPageUrl("Resources")} onClick={() => setMenuOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start text-slate-600">Resources</Button>
            </Link>
            <Link to="/pricing" onClick={() => setMenuOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start text-slate-600">Pricing</Button>
            </Link>
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                Sign In <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 border border-blue-100">
          <DollarSign className="h-3.5 w-3.5" /> Built for contractors who want to protect every dollar
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-5">
          Stop Guessing.<br />
          <span className="text-blue-600">Start Profiting.</span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-8">
          Contractor Profitability Suite gives you a real-time view of every job's margin, flags revenue leakage, and makes change order pricing accurate and fast.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/register">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8 text-base h-12 w-full sm:w-auto">
              Start free 14-day trial <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
          <Link to="/free-job-costing-calculator">
            <Button size="lg" variant="ghost" className="px-8 text-base h-12 w-full sm:w-auto text-blue-600 hover:text-blue-700">
              Try the free job costing calculator
            </Button>
          </Link>
        </div>
        <p className="text-sm text-slate-400 mt-3">No credit card. Set up in 10 minutes. Cancel anytime.</p>
      </section>

      {/* Features */}
      <section className="bg-slate-50 py-14 sm:py-20 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">Everything you need to run a tighter operation</h2>
          <p className="text-slate-500 text-center mb-14 max-w-xl mx-auto">
            From quoting to closeout, Contractor Pro keeps your numbers accurate and your margins protected.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Benefits */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Built for the way contractors actually work</h2>
            <ul className="space-y-3">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-slate-600">{b}</span>
                </li>
              ))}
            </ul>
            <Link to="/pricing" className="inline-block mt-8">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                View Plans & Pricing <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 text-white">
            <div className="text-sm font-medium text-blue-200 mb-6">Job Health Overview</div>
            <div className="space-y-4">
              {[
                { label: "Contract Value", val: "$148,500" },
                { label: "Estimated Cost", val: "$112,000" },
                { label: "Projected Margin", val: "24.6%", highlight: true },
                { label: "Leakage Detected", val: "$3,200", warn: true },
                { label: "COs Approved", val: "7" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b border-blue-500/30 pb-3">
                  <span className="text-blue-200 text-sm">{row.label}</span>
                  <span className={`font-bold text-lg ${row.highlight ? "text-green-300" : row.warn ? "text-amber-300" : "text-white"}`}>
                    {row.val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="bg-slate-50 border-y border-slate-100 py-14 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Built by a contractor, not a software company</h2>
          <p className="text-slate-600 leading-relaxed text-lg">
            I built this because I was losing money on change orders and my accounting software could not tell me which jobs were actually profitable. It does one thing: shows you your real margin per job before it is too late to fix it. If it does not pay for itself on your first job, cancel and I will refund you.
          </p>
        </div>
      </section>

      {/* Cost of NOT tracking */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">What it costs you to NOT track this</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Plain math on one job. The numbers below are typical, not worst case.</p>
        </div>
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <span className="font-semibold text-slate-900">The job</span>
            <span className="text-slate-500">$12,000 remodel contract</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-600 text-sm">3 unbilled change orders, averaging $650 each</span>
              <span className="font-semibold text-red-600 shrink-0">-$1,950</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-600 text-sm">Labor burden under-counted 18% on $4,800 of labor</span>
              <span className="font-semibold text-red-600 shrink-0">-$864</span>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 mt-5 pt-4">
            <span className="font-bold text-slate-900">Total lost on this one job</span>
            <span className="font-bold text-red-600 text-xl">-$2,814</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-slate-500 text-sm">One month of this software</span>
            <span className="font-semibold text-emerald-600">$19</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-700 py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to protect your margins?</h2>
          <p className="text-slate-300 mb-8">Plans start at $19/month. No hidden fees. Cancel anytime.</p>
          <div className="flex flex-col items-center gap-2">
            <Link to="/pricing">
              <Button size="lg" className="bg-blue-500 hover:bg-blue-400 px-10 text-base h-12">
                Get Started Today <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <span className="text-xs font-medium text-emerald-300">30-day money-back guarantee</span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }} />
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-10">Frequently asked questions</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="bg-white border border-slate-200 rounded-2xl p-5">
              <h3 className="font-semibold text-slate-900 mb-1.5">{f.q}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Blog Section */}
      {articles.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 text-blue-600 text-sm font-semibold mb-2">
                <BookOpen className="h-4 w-4" /> Contractor Resources
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Latest Articles</h2>
            </div>
            <Link to={createPageUrl("Resources")}>
              <Button variant="outline" size="sm">View All <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link key={article.id} to={`${createPageUrl("BlogPost")}?slug=${article.slug}`}>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow h-full flex flex-col">
                  <div className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full w-fit mb-3">
                    {article.primary_keyword}
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2 leading-snug flex-1">{article.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">{article.meta_description}</p>
                  <span className="text-sm text-blue-600 font-medium flex items-center gap-1">
                    Read Article <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <SiteFooter />

    </div>
  );
}