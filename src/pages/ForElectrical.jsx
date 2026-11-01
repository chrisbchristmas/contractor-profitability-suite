import React from "react";
import TradePage from "@/components/trades/TradePage";
import { Zap, FileText, Clock, TrendingUp } from "lucide-react";

export default function ForElectrical() {
  return (
    <TradePage
      trade="Electrical"
      slug="electrical"
      icon={Zap}
      metaDescription="Job costing and change order software for electrical contractors. Price panel upgrade scope creep, track permit delays, and protect margin. From $19/month."
      intro="Scope creep on panel upgrades and permit/inspection delays turn profitable quotes into losses. Contractor Profitability Suite shows your real margin per job while there is still time to price the extra work instead of absorbing it."
      features={[
        {
          icon: FileText,
          title: "Panel upgrades priced as change orders",
          desc: "Extra circuits, service upgrades, and owner add-ons get priced with burden, overhead, and markup — not absorbed.",
        },
        {
          icon: Clock,
          title: "Permit and inspection delay time tracked",
          desc: "Log every hour spent waiting out an inspector or re-visit so delays show up in job cost, not in your weekend.",
        },
        {
          icon: TrendingUp,
          title: "Markup held through price swings",
          desc: "Copper and wire prices move weekly. CPS flags any job where your material markup fell below your required minimum.",
        },
      ]}
      example={{
        jobLabel: "$6,500 panel upgrade and rewire",
        rows: [
          { label: "Extra circuits discovered and wired without a change order", lost: "-$520" },
          { label: "4 extra hours at $38/hour fully loaded", lost: "-$152" },
          { label: "Copper price swing not passed through to the client", lost: "-$240" },
        ],
        total: "-$912",
      }}
    />
  );
}