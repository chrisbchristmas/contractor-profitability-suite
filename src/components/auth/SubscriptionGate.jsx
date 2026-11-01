import React from "react";
import { Navigate } from "react-router-dom";
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