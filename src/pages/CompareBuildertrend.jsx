import React from "react";
import ComparePage from "@/components/compare/ComparePage";

export default function CompareBuildertrend() {
  return (
    <ComparePage
      competitor="Buildertrend"
      slug="buildertrend"
      h1="Contractor Profitability Suite vs Buildertrend: Which Fits Your Business?"
      metaTitle="Contractor Profitability Suite vs Buildertrend: Focused Margin Tracking vs Full PM Suite"
      metaDescription="Compare Contractor Profitability Suite vs Buildertrend for job costing, change order profit tracking, and leakage detection. See which tool fits a small contractor team."
      intro="Buildertrend is a full construction management suite for builders and remodelers: scheduling, daily logs, client portals, and financials in one place. Contractor Profitability Suite is a focused margin-tracking layer — per-job costing, change order profit, and leakage detection — for 1-10 person contractors who don't need the whole suite."
      whenOtherBetter="If you need full project management — scheduling, daily logs, client portals, warranties — across multiple large custom builds, Buildertrend is a complete, capable platform, and its price (about $499+/mo) reflects that. If your main problem is knowing your true margin per job and pricing change orders correctly, CPS does that specific job for $19/mo."
      competitorAnswers={{
        job_costing_depth: { text: "Strong financial and job costing tools within a full construction management suite.", level: "full" },
        change_order_tracking: { text: "Change order requests with approval workflow as part of the suite.", level: "full" },
        profit_leakage: { text: "No automatic per-job profit leakage detection.", level: "none" },
        pricing_model_analysis: { text: "No dedicated pricing-model or margin analysis tooling.", level: "none" },
        labor_burden: { text: "No built-in labor burden calculator.", level: "none" },
        ease_of_setup: { text: "Full PM suite: scheduling, portals, and modules take significant setup time.", level: "none" },
        starting_price: { text: "About $499+/mo for core plans.", level: "partial" },
      }}
    />
  );
}