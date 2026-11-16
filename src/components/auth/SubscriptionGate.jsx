import React from "react";
import { Navigate, Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { isPro } from "@/lib/plans";
import { useCustomerAuth } from "@/lib/CustomerAuthContext";

function hasAccess(customer) {
  if (!customer) return false;
  if (customer.subscription_status === "active") return true;
  if (customer.subscription_status === "trial") {
    if (!customer.trial_ends_at) return true;
    if (new Date(customer.trial_ends_at) > new Date()) return true;
  }
  return false;
}

export default function SubscriptionGate({ children }) {
  const { customer, isLoading } = useCustomerAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!customer) {
    return <Navigate to="/login" replace />;
  }

  if (hasAccess(customer)) return children;

  // Trial expired or canceled — send to billing
  return <Navigate to="/Billing" replace />;
}

// Wraps a Pro-only page or panel. Shows an upgrade card instead of the content on the Solo plan.
export function ProGate({ feature, children }) {
  const { customer } = useCustomerAuth();
  if (isPro(customer)) return children;
  return (
    <div className="max-w-md mx-auto my-12 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <Lock className="mx-auto h-8 w-8 text-blue-600" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-semibold text-slate-900">{feature} is a Pro feature</h2>
      <p className="mt-2 text-sm text-slate-600">Upgrade to Pro to unlock it, along with crew logins, online payments, receipt capture and more.</p>
      <Link to="/Billing" className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700">See Pro plan</Link>
    </div>
  );
}
