import React, { useState, useMemo } from "react";
import CalcShell, { Field, Results } from "./CalcShell";
import LeadCapture from "@/components/leads/LeadCapture";

export default function PricingModelAnalyser() {
  const [jobType, setJobType] = useState("");
  const [hours, setHours] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [flatRate, setFlatRate] = useState("");
  const [riskFactor, setRiskFactor] = useState(30);

  const h = parseFloat(hours) || 0;
  const rate = parseFloat(hourlyRate) || 0;
  const flat = parseFloat(flatRate) || 0;
  const risk = parseFloat(riskFactor) || 0;

  const ready = h > 0 && rate > 0 && flat > 0;

  const calc = useMemo(() => {
    if (!ready) return null;

    // Hourly scenario
    const hourlyAtEstimate = h * rate;
    const hourlyBestCase = hourlyAtEstimate; // no overrun = best case for hourly (client pays less, but contractor earns exactly estimate)
    const hourlyWorstCase = h * 2 * rate; // 100% overrun

    // Flat rate scenario
    const flatOnTime = flat;
    const effectiveRateOnTime = h > 0 ? flat / h : 0;
    const hoursAt25Over = h * 1.25;
    const effectiveRate25Over = hoursAt25Over > 0 ? flat / hoursAt25Over : 0;
    const hoursAt50Over = h * 1.5;
    const effectiveRate50Over = hoursAt50Over > 0 ? flat / hoursAt50Over : 0;

    // Breakeven overrun %: at what overrun does flat rate revenue equal hourly revenue
    // Flat = hourlyRate * h * (1 + overrun)
    // overrun = (flat / (hourlyRate * h) - 1) * 100
    const breakevenOverrun = rate > 0 && h > 0 ? ((flat / (rate * h)) - 1) * 100 : 0;

    // Recommendation: if risk factor > breakeven overrun, hourly is better (overruns likely, flat rate loses money)
    // If risk factor < breakeven overrun, flat rate is favourable
    const flatFavourable = risk < breakevenOverrun;

    return {
      hourlyAtEstimate,
      hourlyBestCase,
      hourlyWorstCase,
      flatOnTime,
      effectiveRateOnTime,
      effectiveRate25Over,
      effectiveRate50Over,
      breakevenOverrun,
      flatFavourable,
    };
  }, [ready, h, rate, flat, risk]);

  const $ = (n) => `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <CalcShell
      title="Pricing Model Analyser"
      desc="Compare flat rate vs hourly pricing to decide which is better for a given job type."
    >
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Field label="Job Type / Description" value={jobType} onChange={setJobType} placeholder="e.g. Bathroom remodel" />
        <Field label="Estimated Hours" value={hours} onChange={setHours} placeholder="e.g. 40" />
        <Field label="Hourly Rate ($)" value={hourlyRate} onChange={setHourlyRate} placeholder="e.g. 75" />
        <Field label="Flat Rate Quote ($)" value={flatRate} onChange={setFlatRate} placeholder="e.g. 4000" />
      </div>

      {/* Risk Factor Slider */}
      <div className="mb-6">
        <label className="text-sm font-medium text-slate-700">
          Risk Factor: How often does this job type run over hours?
        </label>
        <div className="flex items-center gap-4 mt-2">
          <input
            type="range"
            min="0"
            max="100"
            value={riskFactor}
            onChange={(e) => setRiskFactor(e.target.value)}
            className="flex-1 accent-blue-600"
          />
          <span className="text-lg font-bold text-blue-600 w-16 text-right">{risk}%</span>
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>Never overruns</span>
          <span>Always overruns</span>
        </div>
      </div>

      {ready && calc && (
        <>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {/* Hourly Scenario */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="text-sm font-bold text-blue-800 mb-3">Hourly Scenario</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Revenue at estimate</span>
                  <span className="font-semibold text-slate-900">{$(calc.hourlyAtEstimate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Best case (no overrun)</span>
                  <span className="font-semibold text-emerald-600">{$(calc.hourlyBestCase)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Worst case (100% overrun)</span>
                  <span className="font-semibold text-red-600">{$(calc.hourlyWorstCase)}</span>
                </div>
              </div>
            </div>

            {/* Flat Rate Scenario */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <h3 className="text-sm font-bold text-purple-800 mb-3">Flat Rate Scenario</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Revenue (fixed)</span>
                  <span className="font-semibold text-slate-900">{$(calc.flatOnTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Effective rate (on time)</span>
                  <span className="font-semibold text-emerald-600">${calc.effectiveRateOnTime.toFixed(0)}/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Effective rate (25% over)</span>
                  <span className="font-semibold text-amber-600">${calc.effectiveRate25Over.toFixed(0)}/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Effective rate (50% over)</span>
                  <span className="font-semibold text-red-600">${calc.effectiveRate50Over.toFixed(0)}/hr</span>
                </div>
              </div>
            </div>
          </div>

          {/* Breakeven */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Breakeven Overrun</p>
                <p className="text-2xl font-bold text-slate-900">{calc.breakevenOverrun.toFixed(1)}%</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 max-w-xs">
                  At {calc.breakevenOverrun.toFixed(1)}% overrun, flat rate and hourly generate the same revenue. Beyond this, flat rate loses money.
                </p>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div
            className={`rounded-xl p-4 border-2 ${
              calc.flatFavourable
                ? "bg-emerald-50 border-emerald-300"
                : "bg-amber-50 border-amber-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  calc.flatFavourable ? "bg-emerald-500" : "bg-amber-500"
                }`}
              >
                <span className="text-white text-xl font-bold">
                  {calc.flatFavourable ? "✓" : "!"}
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Recommendation: {calc.flatFavourable ? "Flat Rate is Favourable" : "Hourly Rate is Favourable"}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Your risk factor ({risk}%) is {calc.flatFavourable ? "below" : "above"} the breakeven overrun of {calc.breakevenOverrun.toFixed(1)}%.{" "}
                  {calc.flatFavourable
                    ? "Overruns are unlikely enough that flat rate protects your margin."
                    : "Overruns are likely enough that hourly pricing protects your revenue."}
                </p>
              </div>
            </div>
          </div>
          <LeadCapture
            source="pricing-model-analyser"
            calcInputs={{ job_type: jobType, estimated_hours: h, hourly_rate: rate, flat_rate_quote: flat, risk_factor_percent: risk }}
            calcResult={{ breakeven_overrun_percent: calc.breakevenOverrun, flat_rate_favourable: calc.flatFavourable }}
          />
        </>
      )}
    </CalcShell>
  );
}