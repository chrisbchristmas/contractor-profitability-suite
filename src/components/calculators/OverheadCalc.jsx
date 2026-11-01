import React, { useState } from "react";
import CalcShell, { Field, Results } from "./CalcShell";

export default function OverheadCalc() {
  const [monthlyOverhead, setMonthlyOverhead] = useState("");
  const [billableHours, setBillableHours] = useState("");
  const [jobHours, setJobHours] = useState("");

  const mo = parseFloat(monthlyOverhead) || 0;
  const bh = parseFloat(billableHours) || 0;
  const jh = parseFloat(jobHours) || 0;
  const perHour = bh > 0 ? mo / bh : 0;
  const jobOverhead = perHour * jh;
  const ready = mo > 0 && bh > 0;

  return (
    <CalcShell title="Overhead Allocation Calculator" desc="Allocates monthly overhead across projects so every job carries its fair share.">
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Field label="Monthly Overhead ($)" value={monthlyOverhead} onChange={setMonthlyOverhead} placeholder="e.g. 8000" />
        <Field label="Billable Hours / Month" value={billableHours} onChange={setBillableHours} placeholder="e.g. 160" />
        <Field label="Job Hours" value={jobHours} onChange={setJobHours} placeholder="e.g. 40" />
      </div>
      {ready && (
        <Results rows={[
          { label: "Overhead per Hour", value: `$${perHour.toFixed(2)}`, highlight: true },
          { label: "Overhead Applied to Job", value: `$${jobOverhead.toFixed(2)}` },
        ]} />
      )}
    </CalcShell>
  );
}