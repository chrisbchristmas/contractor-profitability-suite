import React, { useState } from "react";
import CalcShell, { Field, Results } from "./CalcShell";

export default function HourlyRateCalc() {
  const [salary, setSalary] = useState("");
  const [annualOverhead, setAnnualOverhead] = useState("");
  const [hours, setHours] = useState("");
  const [profit, setProfit] = useState("");

  const s = parseFloat(salary) || 0;
  const ao = parseFloat(annualOverhead) || 0;
  const h = parseFloat(hours) || 0;
  const p = parseFloat(profit) || 0;
  const requiredRevenue = s + ao;
  const hourlyCost = h > 0 ? requiredRevenue / h : 0;
  const billingRate = hourlyCost * (1 + p / 100);
  const ready = s > 0 && h > 0;

  return (
    <CalcShell title="Contractor Hourly Rate Calculator" desc="Calculates minimum billable rate required to hit your income goals.">
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Field label="Desired Annual Salary ($)" value={salary} onChange={setSalary} placeholder="e.g. 80000" />
        <Field label="Annual Overhead ($)" value={annualOverhead} onChange={setAnnualOverhead} placeholder="e.g. 40000" />
        <Field label="Billable Hours / Year" value={hours} onChange={setHours} placeholder="e.g. 1800" />
        <Field label="Profit % Target" value={profit} onChange={setProfit} placeholder="e.g. 20" />
      </div>
      {ready && (
        <Results rows={[
          { label: "Required Revenue", value: `$${requiredRevenue.toFixed(2)}` },
          { label: "Break-Even Hourly Cost", value: `$${hourlyCost.toFixed(2)}` },
          { label: "Minimum Billing Rate", value: `$${billingRate.toFixed(2)}/hr`, highlight: true },
        ]} />
      )}
    </CalcShell>
  );
}