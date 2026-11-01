import React, { useState } from "react";
import CalcShell, { Field, Results } from "./CalcShell";

export default function JobProfitCalc() {
  const [labor, setLabor] = useState("");
  const [material, setMaterial] = useState("");
  const [sub, setSub] = useState("");
  const [overhead, setOverhead] = useState("");
  const [price, setPrice] = useState("");

  const totalCost = (parseFloat(labor) || 0) + (parseFloat(material) || 0) + (parseFloat(sub) || 0) + (parseFloat(overhead) || 0);
  const p = parseFloat(price) || 0;
  const profit = p - totalCost;
  const margin = p > 0 ? (profit / p) * 100 : 0;
  const ready = p > 0 && totalCost > 0;

  return (
    <CalcShell title="Construction Job Profit Calculator" desc="Determines actual profit margin for a job.">
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Field label="Labor Cost ($)" value={labor} onChange={setLabor} placeholder="e.g. 5000" />
        <Field label="Material Cost ($)" value={material} onChange={setMaterial} placeholder="e.g. 3000" />
        <Field label="Subcontractor Cost ($)" value={sub} onChange={setSub} placeholder="e.g. 2000" />
        <Field label="Overhead Cost ($)" value={overhead} onChange={setOverhead} placeholder="e.g. 1000" />
        <Field label="Job Price ($)" value={price} onChange={setPrice} placeholder="e.g. 15000" />
      </div>
      {ready && (
        <Results rows={[
          { label: "Total Job Cost", value: `$${totalCost.toFixed(2)}` },
          { label: "Profit", value: `$${profit.toFixed(2)}`, good: profit > 0, warn: profit < 0 },
          { label: "Profit Margin %", value: `${margin.toFixed(2)}%`, highlight: true },
        ]} />
      )}
    </CalcShell>
  );
}