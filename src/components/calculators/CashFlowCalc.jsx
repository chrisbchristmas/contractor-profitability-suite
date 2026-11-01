import React, { useState } from "react";
import CalcShell, { Field, Results } from "./CalcShell";

export default function CashFlowCalc() {
  const [value, setValue] = useState("");
  const [deposit, setDeposit] = useState("");
  const [progress, setProgress] = useState("");
  const [final, setFinal] = useState("");

  const v = parseFloat(value) || 0;
  const d = parseFloat(deposit) || 0;
  const pr = parseFloat(progress) || 0;
  const f = parseFloat(final) || 0;
  const total = d + pr + f;

  const depositAmt = v * (d / 100);
  const progressAmt = v * (pr / 100);
  const finalAmt = v * (f / 100);
  const totalAllocated = depositAmt + progressAmt + finalAmt;
  const ready = v > 0 && total > 0;

  return (
    <CalcShell title="Project Cash Flow Calculator" desc="Understand your payment timing and cash flow across project milestones.">
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Field label="Project Value ($)" value={value} onChange={setValue} placeholder="e.g. 50000" />
        <Field label="Deposit %" value={deposit} onChange={setDeposit} placeholder="e.g. 25" />
        <Field label="Progress Payment %" value={progress} onChange={setProgress} placeholder="e.g. 50" />
        <Field label="Final Payment %" value={final} onChange={setFinal} placeholder="e.g. 25" />
      </div>
      {ready && (
        <>
          <Results rows={[
            { label: "Deposit Amount", value: `$${depositAmt.toFixed(2)}`, highlight: true },
            { label: "Progress Payment", value: `$${progressAmt.toFixed(2)}` },
            { label: "Final Payment", value: `$${finalAmt.toFixed(2)}` },
            { label: "Total Allocated", value: `$${totalAllocated.toFixed(2)}`, good: Math.abs(totalAllocated - v) < 0.01 },
          ]} />
          {Math.abs(total - 100) > 0.01 && (
            <p className="text-xs text-amber-600 mt-3">⚠ Percentages add up to {total}% — they should total 100%.</p>
          )}
        </>
      )}
    </CalcShell>
  );
}