import React from "react";
import ComparePage from "@/components/compare/ComparePage";

export default function CompareQuickBooks() {
  return (
    <ComparePage
      competitor="QuickBooks"
      slug="quickbooks"
      h1="Contractor Profitability Suite vs QuickBooks: Which Is Right for Your Contracting Business?"
      metaTitle="Contractor Profitability Suite vs QuickBooks: Job Costing Comparison"
      metaDescription="Compare Contractor Profitability Suite vs QuickBooks for construction job costing and change order profit tracking - built for contractors, not general accounting."
      intro="QuickBooks is general-purpose accounting software — excellent for bookkeeping, invoicing, and taxes. Contractor Profitability Suite is purpose-built for contractors who need per-job profitability and change order profit tracking, which QuickBooks handles only at a basic level or not at all."
      whenOtherBetter="If you need full general ledger accounting, payroll, and tax-ready bookkeeping, QuickBooks is the stronger choice. CPS is built specifically for job profitability and change order tracking — many contractors run QuickBooks for accounting and CPS for margin control."
      competitorAnswers={{
        job_costing_depth: { text: "General accounting with basic job costing via classes/projects; no burdened labor detail.", level: "partial" },
        change_order_tracking: { text: "No change order tracking — handled as invoices or estimates.", level: "none" },
        profit_leakage: { text: "No automatic profit leakage detection.", level: "none" },
        pricing_model_analysis: { text: "No dedicated pricing-model or margin analysis tooling.", level: "none" },
        labor_burden: { text: "No built-in labor burden calculator.", level: "none" },
        ease_of_setup: { text: "Familiar accounting setup; profitability tracking requires manual reports.", level: "partial" },
        starting_price: { text: "See QuickBooks' website for current pricing.", level: "partial" },
      }}
    />
  );
}