import React from "react";
import ComparePage from "@/components/compare/ComparePage";

export default function CompareHousecallPro() {
  return (
    <ComparePage
      competitor="Housecall Pro"
      slug="housecall-pro"
      h1="Contractor Profitability Suite vs Housecall Pro: Which Is Right for Your Contracting Business?"
      metaTitle="Contractor Profitability Suite vs Housecall Pro: Job Costing Comparison"
      metaDescription="Compare Contractor Profitability Suite vs Housecall Pro for per-job profitability, change order tracking, and labor burden calculation."
      intro="Housecall Pro is a broad field-service platform focused on scheduling, dispatch, invoicing, and online booking. Contractor Profitability Suite focuses on one thing Jobber-class tools treat as secondary: per-job profitability and change order profit tracking."
      whenOtherBetter="If your priority is dispatching a large service team, online booking, and a field mobile workflow, Housecall Pro's broader feature set may serve you better. CPS is built specifically for profitability tracking, not scheduling."
      competitorAnswers={{
        job_costing_depth: { text: "Basic job costing within its field-service workflow.", level: "partial" },
        change_order_tracking: { text: "No dedicated change-order profit engine; handled as line items or quotes.", level: "none" },
        profit_leakage: { text: "No automatic per-job profit leakage detection.", level: "none" },
        pricing_model_analysis: { text: "No dedicated pricing-model or margin analysis tooling.", level: "none" },
        labor_burden: { text: "No built-in labor burden calculator.", level: "none" },
        ease_of_setup: { text: "Quick for service-scheduling workflows; more configuration if you need dispatch.", level: "partial" },
        starting_price: { text: "See Housecall Pro's website for current pricing.", level: "partial" },
      }}
    />
  );
}