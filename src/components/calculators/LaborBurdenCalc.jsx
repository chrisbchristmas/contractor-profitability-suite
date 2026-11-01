import React, { useState, useEffect } from "react";
import CalcShell, { Field, Results } from "./CalcShell";
import { useCustomerAuth } from "@/lib/CustomerAuthContext";
import { getRegionalRate } from "@/lib/regionalRates";
import LeadCapture from "@/components/leads/LeadCapture";

export default function LaborBurdenCalc() {
  const { customer } = useCustomerAuth();
  const [wage, setWage] = useState("");
  const [payroll, setPayroll] = useState("");
  const [workersComp, setWorkersComp] = useState("");
  const [insurance, setInsurance] = useState("");
  const [overhead, setOverhead] = useState("");

  useEffect(() => {
    if (customer) {
      const regional = customer.base_hourly_wage ?? (customer.state ? getRegionalRate(customer.state, customer.trade_preset) : null);
      if (regional != null && !wage) {
        setWage(String(regional));
      }
    }
  }, [customer]);

  const w = parseFloat(wage) || 0;
  const totalBurden = (parseFloat(payroll) || 0) + (parseFloat(workersComp) || 0) + (parseFloat(insurance) || 0) + (parseFloat(overhead) || 0);
  const multiplier = 1 + totalBurden / 100;
  const trueCost = w * multiplier;
  const ready = w > 0;

  return (
    <CalcShell title="Labor Burden Calculator" desc="Calculates the true cost of labor including taxes, insurance, and overhead.">
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Field label="Hourly Wage ($)" value={wage} onChange={setWage} placeholder="e.g. 25" />
        <Field label="Payroll Tax %" value={payroll} onChange={setPayroll} placeholder="e.g. 7.65" />
        <Field label="Workers' Comp %" value={workersComp} onChange={setWorkersComp} placeholder="e.g. 5" />
        <Field label="Insurance %" value={insurance} onChange={setInsurance} placeholder="e.g. 3" />
        <Field label="Overhead %" value={overhead} onChange={setOverhead} placeholder="e.g. 10" />
      </div>
      {ready && (
        <Results rows={[
          { label: "Total Burden %", value: `${totalBurden.toFixed(2)}%` },
          { label: "Burden Multiplier", value: `${multiplier.toFixed(3)}x` },
          { label: "True Labor Cost / Hour", value: `$${trueCost.toFixed(2)}`, highlight: true },
        ]} />
      )}
      {ready && (
        <LeadCapture
          source="labor-burden-calculator"
          calcInputs={{ hourly_wage: w, payroll_tax_percent: parseFloat(payroll) || 0, workers_comp_percent: parseFloat(workersComp) || 0, insurance_percent: parseFloat(insurance) || 0, overhead_percent: parseFloat(overhead) || 0 }}
          calcResult={{ total_burden_percent: totalBurden, burden_multiplier: multiplier, true_labor_cost_per_hour: trueCost }}
        />
      )}
    </CalcShell>
  );
}