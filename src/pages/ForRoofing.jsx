import React from "react";
import TradePage from "@/components/trades/TradePage";
import { CloudRain, Layers, FileText, DollarSign } from "lucide-react";

export default function ForRoofing() {
  return (
    <TradePage
      trade="Roofing"
      slug="roofing"
      icon={CloudRain}
      metaDescription="Job costing and change order software for roofing contractors. Track material waste, weather delays, and insurance supplements before they eat margin. From $19/month."
      intro="Material waste, weather delays, and supplement/insurance change orders sink roofing margins. Contractor Profitability Suite tracks waste, delay hours, and supplements in one place, so the job you quoted is the job you profited on."
      features={[
        {
          icon: Layers,
          title: "Material waste tracked against estimate",
          desc: "Compare delivered material cost to the estimate per job and catch waste patterns across crews and suppliers.",
        },
        {
          icon: CloudRain,
          title: "Weather delay days costed, not absorbed",
          desc: "Log delay days and the crew hours they burn, so weather risk is visible in job cost instead of hidden in your margin.",
        },
        {
          icon: FileText,
          title: "Insurance supplements billed as change orders",
          desc: "Price supplements with full burden and markup, send them for approval, and track them to signed payment.",
        },
      ]}
      example={{
        jobLabel: "$14,500 roof replacement",
        rows: [
          { label: "Insurance supplement change order under-priced", lost: "-$750" },
          { label: "2 weather-delay days of crew time at full burden", lost: "-$430" },
          { label: "Material waste running 8% over estimate", lost: "-$310" },
        ],
        total: "-$1,490",
      }}
    />
  );
}