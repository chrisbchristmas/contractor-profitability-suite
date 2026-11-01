import React, { useState } from "react";
import CalcShell, { Field, Results } from "./CalcShell";

export default function MaterialMarkupCalc() {
  const [cost, setCost] = useState("");
  const [markup, setMarkup] = useState("");

  const c = parseFloat(cost) || 0;
  const m = parseFloat(markup) || 0;
  const sellPrice = c * (1 + m / 100);
  const profit = sellPrice - c;
  const margin = sellPrice > 0 ? (profit / sellPrice) * 100 : 0;
  const ready = c > 0 && m > 0;

  return (
    <CalcShell title="Material Markup Calculator" desc="Ensures your materials are priced correctly to cover costs and generate profit.">
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Field label="Material Cost ($)" value={cost} onChange={setCost} placeholder="e.g. 2000" />
        <Field label="Markup %" value={markup} onChange={setMarkup} placeholder="e.g. 25" />
      </div>
      {ready && (
        <Results rows={[
          { label: "Material Sell Price", value: `$${sellPrice.toFixed(2)}`, highlight: true },
          { label: "Material Profit", value: `$${profit.toFixed(2)}`, good: true },
          { label: "True Margin %", value: `${margin.toFixed(2)}%` },
        ]} />
      )}
    </CalcShell>
  );
}