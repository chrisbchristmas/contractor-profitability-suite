import React from "react";
import { Link } from "react-router-dom";
import { Shield, CheckCircle, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSeoTitle } from "@/components/seo/SeoMeta";

const PLANS = [
  {
    id: "solo",
    name: "Solo",
    price: 19,
    icon: Zap,
    description: "Perfect for individual contractors",
    features: [
      "Unlimited change orders",
      "PDF exports",
      "Audit log",
      "14-day free trial",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 39,
    icon: Shield,
    description: "For growing contractor teams",
    features: [
      "Everything in Solo",
      "Team members",
      "Advanced reporting",
      "Priority support",
      "14-day free trial",
    ],
    popular: true,
  },
];

export default function Pricing() {
  useSeoTitle("Pricing - $19/mo Job Costing Software for Contractors | Contractor Profitability Suite");
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-100 sticky top-0 z-30 bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">Contractor Pro</span>
          </Link>
          <Link to="/login">
            <Button size="sm" variant="outline">
              Sign In <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Plans */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-16 sm:pb-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Plans start at $19/month. No hidden fees. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {PLANS.map((plan) => {
            const PlanIcon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-7 bg-white flex flex-col ${
                  plan.popular ? "border-blue-400 shadow-md" : "border-slate-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white text-xs px-3">Most Popular</Badge>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <PlanIcon className={`h-5 w-5 ${plan.popular ? "text-blue-500" : "text-slate-500"}`} />
                  <h3 className="font-bold text-slate-900 text-lg">{plan.name}</h3>
                </div>
                <p className="text-slate-500 text-sm mb-4">{plan.description}</p>
                <div className="mb-5">
                  <span className="text-4xl font-bold text-slate-900">${plan.price}</span>
                  <span className="text-slate-400 text-sm">/month</span>
                </div>
                <ul className="space-y-2.5 mb-7 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="w-full">
                  <Button
                    className={`w-full h-11 ${
                      plan.popular ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-700 hover:bg-slate-800"
                    }`}
                  >
                    Start 14-Day Free Trial <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
                <p className="text-xs text-slate-500 text-center mt-2">30-day money-back guarantee</p>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-slate-400 mt-8">
          No credit card required to start your trial. Already a member?{" "}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>.
        </p>
      </section>
    </div>
  );
}