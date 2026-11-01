import React from "react";
import ComparePage from "@/components/compare/ComparePage";

export default function CompareProcore() {
  return (
    <ComparePage
      competitor="Procore"
      slug="procore"
      h1="Contractor Profitability Suite vs Procore: Enterprise Platform or Focused Margin Tool?"
      metaTitle="Contractor Profitability Suite vs Procore: Focused Margin Tracking vs Enterprise Construction Management"
      metaDescription="Compare Contractor Profitability Suite vs Procore for job costing, change orders, and profit tracking. Which fits a 1-10 person contractor team?"
      intro="Procore is enterprise construction management for large GCs and commercial projects. Contractor Profitability Suite is for 1-10 person contractors who need per-job margin and change-order profit without an enterprise platform or enterprise pricing."
      whenOtherBetter="If you run large commercial projects with owners, architects, RFIs, submittals, and formal change management, Procore is built for exactly that. For residential and small commercial crews tracking job margin, it is far more platform — and far more cost — than the problem calls for."
      competitorAnswers={{
        job_costing_depth: { text: "Enterprise cost management and financials at large-project scale.", level: "full" },
        change_order_tracking: { text: "Change events and change orders with RFIs and submittals at enterprise scale.", level: "full" },
        profit_leakage: { text: "No automatic per-job profit leakage detection.", level: "none" },
        pricing_model_analysis: { text: "No dedicated pricing-model or margin analysis tooling.", level: "none" },
        labor_burden: { text: "No built-in labor burden calculator.", level: "none" },
        ease_of_setup: { text: "Enterprise implementation and onboarding required.", level: "none" },
        starting_price: { text: "Custom pricing; typically enterprise budgets.", level: "partial" },
      }}
    />
  );
}