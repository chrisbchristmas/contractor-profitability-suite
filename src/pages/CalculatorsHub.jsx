import React from "react";
import { Link } from "react-router-dom";
import { Shield, ArrowRight, Calculator, FileText, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { useSeoTitle } from "@/components/seo/SeoMeta";

const calculators = [
  {
    icon: FileText,
    title: "Free Change Order Calculator",
    desc: "Price change orders accurately with built-in labor burden, overhead, markup, and tax — see your true margin before you sign.",
    path: "/free-change-order-calculator",
  },
  {
    icon: Calculator,
    title: "Free Job Costing Calculator",
    desc: "Enter your project numbers to instantly see gross margin, markup, and whether your job is on target.",
    path: "/calculators/job-costing-calculator",
  },
  {
    icon: TrendingUp,
    title: "Pricing Model Analyser",
    desc: "Compare hourly vs. flat-rate pricing models with risk-adjusted analysis to find the most profitable approach for each job type.",
    path: "/calculators/pricing-model-analyser",
  },
  {
    icon: Users,
    title: "Labor Burden Calculator",
    desc: "Calculate your true labor cost per hour including payroll taxes, workers' comp, benefits, and overhead — so you never underprice labor again.",
    path: "/calculators/labor-burden-calculator",
  },
];

export default function CalculatorsHub() {
  useSeoTitle("Free Contractor Calculators: Job Costing, Labor Burden, Change Orders");
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-slate-100 sticky top-0 z-30 bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">Contractor Pro</span>
          </Link>
          <div className="flex items-center gap-3">
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
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">Free Contractor Calculators</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Powerful tools to price jobs right, protect your margins, and stop leaving money on the table.
        </p>
      </section>

      {/* Calculator Cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {calculators.map((calc) => (
            <Link key={calc.path} to={calc.path}>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md hover:border-blue-200 transition-all h-full flex flex-col">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                  <calc.icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{calc.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed flex-1">{calc.desc}</p>
                <span className="text-sm text-blue-600 font-medium flex items-center gap-1 mt-4">
                  Open Calculator <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-700 py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Want these tools built into your workflow?</h2>
          <p className="text-slate-300 mb-6">Get real-time margin tracking, change order pricing, and leakage detection on every job. Plans from $19/month.</p>
          <Link to="/pricing">
            <Button size="lg" className="bg-blue-500 hover:bg-blue-400 px-8 text-base h-12">
              See Plans & Pricing <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex justify-center text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-500" />
            <span>Contractor Profitability Suite</span>
          </div>
        </div>
      </footer>
    </div>
  );
}