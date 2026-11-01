import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useCustomerAuth } from "@/lib/CustomerAuthContext";
import { CreditCard, CheckCircle, AlertCircle, Clock, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const statusConfig = {
  active: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50 border-emerald-200", label: "Active" },
  trial: { icon: Clock, color: "text-blue-500", bg: "bg-blue-50 border-blue-200", label: "Trial" },
  past_due: { icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50 border-amber-200", label: "Past Due" },
  canceled: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-50 border-red-200", label: "Canceled" },
};

const PLANS = [
  {
    id: "solo",
    name: "Solo",
    price: 19,
    icon: Zap,
    description: "Perfect for individual contractors",
    features: ["Unlimited change orders", "PDF exports", "Audit log", "14-day free trial"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 39,
    icon: Shield,
    description: "For growing contractor teams",
    features: ["Everything in Solo", "Team members", "Advanced reporting", "Priority support", "14-day free trial"],
    popular: true,
  },
];

export default function Billing() {
  const { customer: user, isLoading } = useCustomerAuth();
  const [loadingPlan, setLoadingPlan] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      // The webhook updates the Customer entity async; reload customer from server
      window.location.search = "";
    }
  }, []);

  const handleCheckout = async (planId) => {
    const token = localStorage.getItem("cps_session_token");
    if (!token) {
      window.location.href = "/login?redirect=/Billing";
      return;
    }
    if (window.self !== window.top) {
      alert("Checkout only works from the published app. Please open the published version to subscribe.");
      return;
    }
    setLoadingPlan(planId);
    try {
      const session_token = localStorage.getItem('cps_session_token');
      const res = await base44.functions.invoke("stripeCheckout", {
        plan: planId,
        session_token,
        successUrl: `${window.location.origin}/Billing?success=true`,
        cancelUrl: `${window.location.origin}/Billing`,
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPlan(null);
    }
  };

  const handlePortal = async () => {
    setLoadingPlan("portal");
    try {
      const session_token = localStorage.getItem('cps_session_token');
      const res = await base44.functions.invoke("stripePortal", {
        session_token,
        returnUrl: `${window.location.origin}/Billing`,
      });
      if (res.data?.url) window.location.href = res.data.url;
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPlan(null);
    }
  };

  const status = user?.subscription_status || "trial";
  const cfg = statusConfig[status] || statusConfig.trial;
  const Icon = cfg.icon;
  const isActive = status === "active";

  // Trial days remaining
  const trialDaysRemaining = (() => {
    if (status !== "trial" || !user?.trial_ends_at) return null;
    const diff = new Date(user.trial_ends_at) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();
  const trialExpired = status === "trial" && trialDaysRemaining !== null && trialDaysRemaining === 0;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-600 tracking-tight">Billing</h1>
        </div>
        <div className="h-32 rounded-xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-600 tracking-tight">Billing</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your subscription</p>
      </div>

      {/* Status banner */}
      {user && <div className={`rounded-xl border p-5 mb-8 flex items-start gap-3 ${cfg.bg}`}>
        <Icon className={`h-5 w-5 mt-0.5 ${cfg.color}`} />
        <div>
          <p className={`font-semibold text-slate-900`}>Subscription: <span className={cfg.color}>{cfg.label}</span></p>
          {status === "active" && (
            <p className="text-sm text-emerald-700 mt-0.5">
              You're on the <strong>{user?.subscription_plan || "Pro"}</strong> plan. Thank you for using Contractor Profitability Suite!
            </p>
          )}
          {status === "trial" && !trialExpired && (
            <p className="text-sm text-blue-700 mt-0.5">
              Free trial — <strong>{trialDaysRemaining} day{trialDaysRemaining !== 1 ? "s" : ""} remaining</strong>. No card required.
            </p>
          )}
          {status === "trial" && trialExpired && (
            <p className="text-sm text-red-700 mt-0.5">
              Trial expired. Pick a plan to continue.
            </p>
          )}
          {status === "past_due" && <p className="text-sm text-amber-700 mt-0.5">Your payment failed. Update your payment method to restore access.</p>}
          {status === "canceled" && <p className="text-sm text-red-700 mt-0.5">Your subscription is canceled. Reactivate below.</p>}
        </div>
      </div>}

      {/* Plan cards */}
      {!isActive && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          {PLANS.map((plan) => {
            const PlanIcon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border p-6 bg-white flex flex-col ${plan.popular ? "border-blue-400 shadow-md" : "border-slate-200"}`}
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
                  <span className="text-3xl font-bold text-slate-900">${plan.price}</span>
                  <span className="text-slate-400 text-sm">/month</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${plan.popular ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-600 hover:bg-slate-700"}`}
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loadingPlan !== null}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {loadingPlan === plan.id ? "Redirecting..." : `Start 14-Day Trial`}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Active subscription management */}
      {isActive && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Plan Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Plan</span>
              <span className="font-medium text-slate-900">{user?.subscription_plan || "MarginGuard"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Billing</span>
              <span className="font-medium text-slate-900">Monthly</span>
            </div>
            {user?.stripe_customer_id && (
              <div className="flex justify-between">
                <span className="text-slate-500">Customer ID</span>
                <span className="font-mono text-xs text-slate-400">{user.stripe_customer_id}</span>
              </div>
            )}
          </div>
          <div className="mt-6">
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loadingPlan === "portal"}
              onClick={handlePortal}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {loadingPlan === "portal" ? "Redirecting..." : "Manage Billing"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}