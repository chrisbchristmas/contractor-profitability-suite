import React, { useState } from "react";
import CalcShell, { Field, Results } from "./CalcShell";

export default function BreakEvenCalc() {
  const [fixed, setFixed] = useState("");
  const [variable, setVariable] = useState("");

  const f = parseFloat(fixed) || 0;
  const v = parseFloat(variable) || 0;
  const denominator = 1 - v / 100;
  const breakEven = denominator > 0 ? f / denominator : 0;
  const ready = f > 0 && v > 0 && denominator > 0;

  return (
    <CalcShell title="Construction Break-Even Calculator" desc="Determines how much revenue is required to cover all your costs.">
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Field label="Fixed Costs ($)" value={fixed} onChange={setFixed} placeholder="e.g. 10000" />
        <Field label="Variable Cost %" value={variable} onChange={setVariable} placeholder="e.g. 60" />
      </div>
      {ready && (
        <Results rows={[
          { label: "Required Revenue to Break Even", value: `$${breakEven.toFixed(2)}`, highlight: true },
          { label: "Variable Costs at Break-Even", value: `$${(breakEven * v / 100).toFixed(2)}` },
          { label: "Contribution Margin", value: `${(100 - v).toFixed(1)}%` },
        ]} />
      )}
    </CalcShell>
  );
}