import React, { useState } from "react";
import CalcShell, { Field, Results } from "./CalcShell";

export default function MarkupMarginCalc() {
  const [cost, setCost] = useState("");
  const [markup, setMarkup] = useState("");

  const c = parseFloat(cost) || 0;
  const m = parseFloat(markup) || 0;
  const sellPrice = c * (1 + m / 100);
  const profit = sellPrice - c;
  const margin = sellPrice > 0 ? (profit / sellPrice) * 100 : 0;
  const ready = c > 0 && m > 0;

  return (
    <CalcShell
      title="Markup vs Margin Calculator"
      desc="Contractors often confuse markup and margin. This converts between the two instantly."
    >
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Field label="Cost ($)" value={cost} onChange={setCost} placeholder="e.g. 1000" />
        <Field label="Markup %" value={markup} onChange={setMarkup} placeholder="e.g. 30" />
      </div>
      {ready && (
        <>
          <Results rows={[
            { label: "Sell Price", value: `$${sellPrice.toFixed(2)}`, highlight: true },
            { label: "Profit", value: `$${profit.toFixed(2)}`, good: true },
            { label: "True Margin %", value: `${margin.toFixed(2)}%`, warn: margin < 20 },
          ]} />
          <p className="text-xs text-slate-400 mt-4">
            Note: A {m}% markup = only {margin.toFixed(1)}% margin. Margin is always lower than markup.
          </p>
        </>
      )}
    </CalcShell>
  );
}