import React, { useState } from "react";
import CalcShell, { Field, Results } from "./CalcShell";

export default function ChangeOrderCalc() {
  const [hours, setHours] = useState("");
  const [rate, setRate] = useState("");
  const [material, setMaterial] = useState("");
  const [markup, setMarkup] = useState("");

  const laborTotal = (parseFloat(hours) || 0) * (parseFloat(rate) || 0);
  const costTotal = laborTotal + (parseFloat(material) || 0);
  const m = parseFloat(markup) || 0;
  const sellPrice = costTotal * (1 + m / 100);
  const profit = sellPrice - costTotal;
  const margin = sellPrice > 0 ? (profit / sellPrice) * 100 : 0;
  const ready = costTotal > 0 && m > 0;

  return (
    <CalcShell title="Change Order Pricing Calculator" desc="Helps contractors properly price change orders with labor, materials, and markup.">
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Field label="Labor Hours" value={hours} onChange={setHours} placeholder="e.g. 8" />
        <Field label="Labor Rate ($/hr)" value={rate} onChange={setRate} placeholder="e.g. 65" />
        <Field label="Material Cost ($)" value={material} onChange={setMaterial} placeholder="e.g. 500" />
        <Field label="Markup %" value={markup} onChange={setMarkup} placeholder="e.g. 20" />
      </div>
      {ready && (
        <Results rows={[
          { label: "Labor Total", value: `$${laborTotal.toFixed(2)}` },
          { label: "Total Cost", value: `$${costTotal.toFixed(2)}` },
          { label: "Change Order Price", value: `$${sellPrice.toFixed(2)}`, highlight: true },
          { label: "Profit", value: `$${profit.toFixed(2)}`, good: profit > 0 },
          { label: "Profit Margin %", value: `${margin.toFixed(2)}%` },
        ]} />
      )}
    </CalcShell>
  );
}