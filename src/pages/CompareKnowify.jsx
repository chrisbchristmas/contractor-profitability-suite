import React from "react";
import ComparePage from "@/components/compare/ComparePage";

export default function CompareKnowify() {
  return (
    <ComparePage
      competitor="Knowify"
      slug="knowify"
      h1="Contractor Profitability Suite vs Knowify: Job Costing Compared"
      metaTitle="Contractor Profitability Suite vs Knowify: Job Costing and Margin Tracking Compared"
      metaDescription="Compare Contractor Profitability Suite vs Knowify for job costing, change order profit, and labor burden. See which tool fits your contracting business."
      intro="Knowify is job costing and project tracking for service contractors, with tight QuickBooks Online sync. CPS overlaps on job costing but adds a dedicated change-order profit engine, automatic leakage detection, and labor burden tooling — at a lower entry price."
      whenOtherBetter="If QBO-native job costing and contract workflows are your whole requirement, Knowify is a solid pick. If you also need change orders priced with real burden and markup, leakage flags before a job bleeds profit, and a built-in labor burden calculator, CPS covers that for $19/mo."
      competitorAnswers={{
        job_costing_depth: { text: "Real job costing with QuickBooks sync for service contractors.", level: "full" },
        change_order_tracking: { text: "Contract and change order workflows exist, though lighter than a dedicated CO profit engine.", level: "partial" },
        profit_leakage: { text: "No automatic per-job profit leakage detection.", level: "none" },
        pricing_model_analysis: { text: "No dedicated pricing-model or margin analysis tooling.", level: "none" },
        labor_burden: { text: "No built-in labor burden calculator.", level: "none" },
        ease_of_setup: { text: "Moderate setup; QuickBooks mapping is straightforward.", level: "partial" },
        starting_price: { text: "About $99+/mo.", level: "partial" },
      }}
    />
  );
}