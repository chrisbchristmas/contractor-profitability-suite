import React, { useState } from "react";
import CalcShell, { Field, Results } from "./CalcShell";

export default function SubcontractorCalc() {
  const [bid, setBid] = useState("");
  const [markup, setMarkup] = useState("");

  const b = parseFloat(bid) || 0;
  const m = parseFloat(markup) || 0;
  const sellPrice = b * (1 + m / 100);
  const profit = sellPrice - b;
  const margin = sellPrice > 0 ? (profit / sellPrice) * 100 : 0;
  const ready = b > 0 && m > 0;

  return (
    <CalcShell title="Subcontractor Markup Calculator" desc="Calculates what to charge your client for subcontracted work.">
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Field label="Subcontractor Bid ($)" value={bid} onChange={setBid} placeholder="e.g. 5000" />
        <Field label="Markup %" value={markup} onChange={setMarkup} placeholder="e.g. 15" />
      </div>
      {ready && (
        <Results rows={[
          { label: "Customer Price", value: `$${sellPrice.toFixed(2)}`, highlight: true },
          { label: "Your Profit", value: `$${profit.toFixed(2)}`, good: true },
          { label: "Margin %", value: `${margin.toFixed(2)}%` },
        ]} />
      )}
    </CalcShell>
  );
}