import React from "react";
import TradePage from "@/components/trades/TradePage";
import { Thermometer, DollarSign, Clock, FileText } from "lucide-react";

export default function ForHvac() {
  return (
    <TradePage
      trade="HVAC"
      slug="hvac"
      icon={Thermometer}
      metaDescription="Job costing and change order software built for HVAC contractors. Track equipment cost swings, callback labor, and true per-job margin. From $19/month."
      intro="Equipment cost swings and unbilled callbacks eat HVAC margins silently, job after job. Contractor Profitability Suite shows your true cost per install and repair — including burdened labor and callback hours — before the season's profit disappears."
      features={[
        {
          icon: DollarSign,
          title: "True cost per install and repair",
          desc: "Equipment, materials, and fully burdened labor priced per job, so supplier price swings never silently eat your margin.",
        },
        {
          icon: Clock,
          title: "Callback hours stop being free",
          desc: "Log re-work time against the original job and see exactly what each callback cost you versus the estimate.",
        },
        {
          icon: FileText,
          title: "Scope add-ons priced right",
          desc: "Duct modifications, accessories, and code-driven extras become change orders priced with burden, overhead, and markup.",
        },
      ]}
      example={{
        jobLabel: "$9,800 system replacement",
        rows: [
          { label: "Equipment price swing not re-quoted to the client", lost: "-$620" },
          { label: "6 callback hours at $41/hour fully loaded", lost: "-$246" },
          { label: "Duct modification change order priced without burden", lost: "-$190" },
        ],
        total: "-$1,056",
      }}
    />
  );
}