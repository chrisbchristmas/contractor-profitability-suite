import React from "react";
import ComparePage from "@/components/compare/ComparePage";

export default function CompareContractorForeman() {
  return (
    <ComparePage
      competitor="Contractor Foreman"
      slug="contractor-foreman"
      h1="Contractor Profitability Suite vs Contractor Foreman: Which Do You Need?"
      metaTitle="Contractor Profitability Suite vs Contractor Foreman: Margin Tracking vs All-in-One PM"
      metaDescription="Compare Contractor Profitability Suite vs Contractor Foreman for job costing, change orders, and profit tracking. See which tool fits a small contractor team."
      intro="Contractor Foreman is an affordable all-in-one project management platform for small contractors: schedules, estimates, invoices, timesheets, and more. CPS is narrower and cheaper still on the margin side: it exists to protect per-job profit, not to run your whole office."
      whenOtherBetter="If you want one low-cost app to run scheduling, documents, timesheets, and day-to-day project admin, Contractor Foreman covers a lot for about $49+/mo. If your main problem is profit slipping through change orders and unbilled costs, CPS is the focused tool for that."
      competitorAnswers={{
        job_costing_depth: { text: "Job costing and estimates within a broad all-in-one PM toolkit.", level: "partial" },
        change_order_tracking: { text: "Change orders supported as part of general project management.", level: "partial" },
        profit_leakage: { text: "No automatic per-job profit leakage detection.", level: "none" },
        pricing_model_analysis: { text: "No dedicated pricing-model or margin analysis tooling.", level: "none" },
        labor_burden: { text: "No built-in labor burden calculator.", level: "none" },
        ease_of_setup: { text: "Lighter than enterprise suites, but still a broad all-in-one setup.", level: "partial" },
        starting_price: { text: "About $49+/mo.", level: "partial" },
      }}
    />
  );
}