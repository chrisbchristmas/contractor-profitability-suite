import React from "react";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export default function JobRiskBadge({ riskLabel, riskScore }) {
  const style = riskScore >= 80
    ? "bg-red-50 text-red-700 border-red-200"
    : riskScore >= 50
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border", style)}>
      <Shield className="h-3 w-3" />
      {riskLabel}
    </span>
  );
}