import React from "react";
import TradePage from "@/components/trades/TradePage";
import { Wrench, DollarSign, Layers, TrendingUp } from "lucide-react";

export default function ForPlumbing() {
  return (
    <TradePage
      trade="Plumbing"
      slug="plumbing"
      icon={Wrench}
      metaDescription="Job costing and change order software for plumbing contractors. Price emergency calls correctly, hold material markup, and see true margin per job. From $19/month."
      intro="Emergency call pricing and material markup confusion make plumbing margins a guessing game. Contractor Profitability Suite prices every job with true labor burden and consistent markup, so you know your real margin before you leave the driveway."
      features={[
        {
          icon: Wrench,
          title: "Emergency and diagnostic call pricing",
          desc: "Save presets for urgent calls and diagnostics so after-hours work is priced on policy, not on how tired you are.",
        },
        {
          icon: Layers,
          title: "Consistent material markup, every quote",
          desc: "Your required markup is enforced on every line, so pipe and fixture price swings never quietly erase profit.",
        },
        {
          icon: DollarSign,
          title: "True labor burden on every hour",
          desc: "Payroll taxes, workers' comp, and insurance are built into every labor hour — not discovered at year end.",
        },
      ]}
      example={{
        jobLabel: "$3,800 bathroom repipe",
        rows: [
          { label: "Materials sold at 12% markup instead of your required 35%", lost: "-$260" },
          { label: "Repair scope discovered on site and never billed", lost: "-$400" },
          { label: "Labor burden under-counted on 56 crew hours", lost: "-$210" },
        ],
        total: "-$870",
      }}
    />
  );
}