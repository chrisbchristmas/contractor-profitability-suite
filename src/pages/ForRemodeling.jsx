import React from "react";
import TradePage from "@/components/trades/TradePage";
import { FileText, AlertTriangle, TrendingUp, DollarSign } from "lucide-react";

export default function ForRemodeling() {
  return (
    <TradePage
      trade="Remodeling"
      slug="remodeling"
      icon={DollarSign}
      metaDescription="Job costing and change order software for remodeling contractors. Price homeowner scope changes, track allowance overages, and see true margin per job. From $19/month."
      intro="Homeowner-driven scope changes and allowance overages are where remodel margins go to die. Contractor Profitability Suite prices every change with full burden and markup, and tracks every allowance before it eats the profit you quoted."
      features={[
        {
          icon: FileText,
          title: "Every scope change priced and e-signed",
          desc: "Homeowner requests become change orders with burden, overhead, and markup — approved by e-signature, not a text message.",
        },
        {
          icon: AlertTriangle,
          title: "Allowance overages caught before closeout",
          desc: "Track tile, fixtures, and finish allowances against actuals as the job runs, so overages get billed, not absorbed.",
        },
        {
          icon: TrendingUp,
          title: "Real margin per remodel, live",
          desc: "See true margin on every active job — burdened labor, subs, and materials included — while you can still act on it.",
        },
      ]}
      example={{
        jobLabel: "$12,000 kitchen remodel",
        rows: [
          { label: "3 unbilled change orders, averaging $650 each", lost: "-$1,950" },
          { label: "Tile allowance overage absorbed instead of billed", lost: "-$480" },
          { label: "Labor burden under-counted 18% on $4,800 of labor", lost: "-$864" },
        ],
        total: "-$3,294",
      }}
    />
  );
}