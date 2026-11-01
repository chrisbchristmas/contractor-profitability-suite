import React from "react";
import ComparePage from "@/components/compare/ComparePage";

export default function CompareJobber() {
  return (
    <ComparePage
      competitor="Jobber"
      slug="jobber"
      h1="Contractor Profitability Suite vs Jobber: Which Is Right for Your Contracting Business?"
      metaTitle="Contractor Profitability Suite vs Jobber: Job Costing Comparison"
      metaDescription="Compare Contractor Profitability Suite vs Jobber for job costing, change order tracking, and profit leakage detection. See which tool fits your contracting business."
      intro="Jobber is a strong field-service management platform built around scheduling, dispatch, and CRM. Contractor Profitability Suite is narrower on purpose — it's built for per-job profitability and change order profit tracking, the areas most contractors find Jobber treats as a secondary concern."
      whenOtherBetter="If you run a large crew and need full scheduling, dispatching, quoting, and client CRM in one place, Jobber's broader feature set may serve you better. CPS is built specifically for profitability tracking, not scheduling — many contractors use both side by side."
      competitorAnswers={{
        job_costing_depth: { text: "Basic job costing as part of broader field-service management.", level: "partial" },
        change_order_tracking: { text: "No dedicated change-order profit engine; handled as line items or quotes.", level: "none" },
        profit_leakage: { text: "No automatic per-job profit leakage detection.", level: "none" },
        pricing_model_analysis: { text: "No dedicated pricing-model or margin analysis tooling.", level: "none" },
        labor_burden: { text: "No built-in labor burden calculator.", level: "none" },
        ease_of_setup: { text: "Quick for field-service workflows; more configuration if you need scheduling/dispatch.", level: "partial" },
        starting_price: { text: "See Jobber's website for current pricing.", level: "partial" },
      }}
    />
  );
}