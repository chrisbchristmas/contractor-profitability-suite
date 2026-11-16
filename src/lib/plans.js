// Single source of truth for what each plan includes. Pricing, Billing and ProGate all read this.
export const SOLO_FEATURES = [
  "Unlimited jobs, estimates & change orders",
  "Estimate → job in one click",
  "Invoices & PDF exports",
  "Field clock-in with GPS (installs as a phone app)",
  "Text change-order approval links",
  "CSV import from spreadsheets",
  "Audit log",
  "14-day free trial",
];

export const PRO_FEATURES = [
  "Crew logins with roles — field techs never see your margins",
  "Online invoice payments (card & ACH to your own Stripe)",
  "Receipt capture with AI line-item extraction",
  "Progress billing & retainage",
  "Weekly margin-loss email digest",
  "Material price lists",
  "Cost-code variance (labor / materials / subs / equipment)",
  "Priority support",
];

// Mirrors hasPro() in supabase/functions/_shared/owner.ts: every feature is open during the trial, then Pro plan only.
export function isPro(customer) {
  if (!customer) return false;
  if (customer.subscription_status === "active") return customer.subscription_plan === "pro";
  return customer.subscription_status === "trial" && (!customer.trial_ends_at || new Date(customer.trial_ends_at) > new Date());
}
