import React from "react";
import { CheckCircle, AlertCircle } from "lucide-react";

// Landing page for payInvoice redirects (?status=paid|pending|cancelled|invalid|unavailable|error).
const MESSAGES = {
  paid: ["Payment received", "Thank you — your payment has been recorded and the contractor has been notified."],
  pending: ["Payment processing", "Your payment is still processing. You'll receive a receipt from Stripe once it completes."],
  cancelled: ["Payment cancelled", "No charge was made. You can use the same link to pay whenever you're ready."],
  invalid: ["Link not valid", "This payment link is invalid or no longer active. Please contact your contractor."],
  unavailable: ["Online payment unavailable", "This contractor isn't accepting online payments right now. Please contact them directly."],
  error: ["Something went wrong", "We couldn't start your payment. Please try the link again in a moment."],
};

export default function InvoicePaid() {
  const status = new URLSearchParams(window.location.search).get("status");
  const [title, body] = MESSAGES[status] || MESSAGES.error;
  const ok = status === "paid";
  const Icon = ok ? CheckCircle : AlertCircle;
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center max-w-md w-full">
        <Icon className={`h-12 w-12 mx-auto mb-4 ${ok ? "text-emerald-500" : "text-amber-500"}`} aria-hidden="true" />
        <h1 className="text-xl font-bold text-slate-900 mb-2">{title}</h1>
        <p className="text-slate-500 text-sm">{body}</p>
      </div>
    </main>
  );
}
