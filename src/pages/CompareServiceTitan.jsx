import React from "react";
import ComparePage from "@/components/compare/ComparePage";

export default function CompareServiceTitan() {
  return (
    <ComparePage
      competitor="ServiceTitan"
      slug="servicetitan"
      h1="Contractor Profitability Suite vs ServiceTitan: Enterprise Field Service or Focused Margin Tool?"
      metaTitle="Contractor Profitability Suite vs ServiceTitan: Focused Margin Tracking vs Enterprise Field Service"
      metaDescription="Compare Contractor Profitability Suite vs ServiceTitan for job costing, change orders, and profit tracking. Which fits a small contractor team?"
      intro="ServiceTitan is the enterprise field-service platform for home services: dispatch, call booking, marketing ROI, memberships, and payroll. Contractor Profitability Suite is the focused, cheaper margin layer for small contractor teams that don't need an enterprise field-service system."
      whenOtherBetter="For large home-services companies (10+ trucks) that need dispatch, booking, marketing attribution, and payroll at scale, ServiceTitan is the category leader — priced accordingly. If you're a small team whose main problem is losing money per job, CPS covers that at $19/mo."
      competitorAnswers={{
        job_costing_depth: { text: "Job costing tied to field service operations at enterprise scale.", level: "partial" },
        change_order_tracking: { text: "Estimates and proposal workflows; no dedicated change-order profit engine.", level: "partial" },
        profit_leakage: { text: "No automatic per-job profit leakage detection.", level: "none" },
        pricing_model_analysis: { text: "No dedicated pricing-model or margin analysis tooling.", level: "none" },
        labor_burden: { text: "No built-in labor burden calculator.", level: "none" },
        ease_of_setup: { text: "Enterprise-grade onboarding and configuration.", level: "none" },
        starting_price: { text: "Custom pricing; typically the most expensive option here.", level: "partial" },
      }}
    />
  );
}