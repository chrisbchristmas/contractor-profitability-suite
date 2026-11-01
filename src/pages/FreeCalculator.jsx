import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Info, TrendingUp, AlertTriangle, CheckCircle, XCircle, Mail, ArrowRight } from "lucide-react";
import { safeJsonLd } from "@/utils/safeJsonLd";
import LeadCapture from "@/components/leads/LeadCapture";

// ---------- helpers ----------
function fmt(n) {
  return n?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00";
}
function pct(n) {
  return (n ?? 0).toFixed(1) + "%";
}

function Tooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="text-gray-400 hover:text-gray-600"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {show && (
        <span className="absolute z-10 bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2.5 py-1.5 w-52 text-center shadow-lg">
          {text}
        </span>
      )}
    </span>
  );
}

function Field({ label, tooltip, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </label>
      {children}
    </div>
  );
}

function NumInput({ value, onChange, placeholder = "0", min = "0", step = "any" }) {
  return (
    <input
      type="number"
      min={min}
      step={step}
      value={value}
      onChange={e => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      placeholder={placeholder}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  );
}

function StatBox({ label, value, sub, color = "gray" }) {
  const colors = {
    green: "bg-emerald-50 border-emerald-200 text-emerald-700",
    yellow: "bg-amber-50 border-amber-200 text-amber-700",
    red: "bg-red-50 border-red-200 text-red-700",
    gray: "bg-gray-50 border-gray-200 text-gray-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
  };
  return (
    <div className={`rounded-xl border p-4 text-center ${colors[color]}`}>
      <div className="text-xs font-medium uppercase tracking-wide opacity-70 mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs mt-0.5 opacity-60">{sub}</div>}
    </div>
  );
}

// ---------- defaults ----------
const DEFAULTS = {
  labor_hours: "",
  labor_rate: 65,
  labor_burden_percent: 25,
  materials_cost: "",
  equipment_cost: 0,
  subcontractor_cost: 0,
  overhead_percent: 10,
  markup_percent: 35,
  tax_percent: 0,
  target_margin_percent: 25,
  description: "",
};

export default function FreeCalculator() {
  const [presets, setPresets] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [inputs, setInputs] = useState(DEFAULTS);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const loggedRef = useRef(false);
  const logTimerRef = useRef(null);

  // Load cost presets
  useEffect(() => {
    base44.entities.CostPreset.list().then(setPresets).catch(() => {});
  }, []);

  // Set page meta
  useEffect(() => {
    document.title = "Free Change Order Profit Calculator | Free Tool";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Free calculator shows your true change order profit including labor burden, overhead, and markup. No signup required.");
    return () => { document.title = "Contractor Profitability Suite"; };
  }, []);

  const set = (key, val) => setInputs(prev => ({ ...prev, [key]: val }));

  const applyPreset = (id) => {
    setSelectedPreset(id);
    if (!id) return;
    const p = presets.find(x => x.id === id);
    if (!p) return;
    setInputs(prev => ({
      ...prev,
      labor_rate: p.labor_rate ?? prev.labor_rate,
      labor_burden_percent: p.labor_burden_percent ?? prev.labor_burden_percent,
      markup_percent: p.markup_percent ?? prev.markup_percent,
      overhead_percent: p.overhead_percent ?? prev.overhead_percent,
    }));
  };

  // ---------- calculations ----------
  const h = Number(inputs.labor_hours) || 0;
  const rate = Number(inputs.labor_rate) || 0;
  const burden = Number(inputs.labor_burden_percent) || 0;
  const mats = Number(inputs.materials_cost) || 0;
  const equip = Number(inputs.equipment_cost) || 0;
  const sub = Number(inputs.subcontractor_cost) || 0;
  const ovhPct = Number(inputs.overhead_percent) || 0;
  const mkupPct = Number(inputs.markup_percent) || 0;
  const taxPct = Number(inputs.tax_percent) || 0;
  const targetMgn = Number(inputs.target_margin_percent) || 0;

  const laborTrueCost = h * rate * (1 + burden / 100);
  const directCosts = laborTrueCost + mats + equip + sub;
  const overheadAmount = directCosts * (ovhPct / 100);
  const trueCost = directCosts + overheadAmount;
  const markupAmount = trueCost * (mkupPct / 100);
  const preTax = trueCost + markupAmount;
  const taxAmount = preTax * (taxPct / 100);
  const clientPrice = preTax + taxAmount;
  const profit = preTax - trueCost;
  const actualMargin = preTax > 0 ? (profit / preTax) * 100 : 0;
  const profitPerHour = h > 0 ? profit / h : 0;

  const hasValues = h > 0 || mats > 0 || equip > 0 || sub > 0;

  // Leakage status
  let leakageStatus = "green";
  let leakageBanner = null;
  if (hasValues && preTax > 0) {
    const ratio = targetMgn > 0 ? actualMargin / targetMgn : 1;
    if (ratio >= 1) {
      leakageStatus = "green";
      leakageBanner = { color: "green", icon: CheckCircle, text: `You are hitting your margin goal (${pct(actualMargin)} ≥ ${pct(targetMgn)} target).` };
    } else if (ratio >= 0.7) {
      leakageStatus = "yellow";
      const gap = targetMgn - actualMargin;
      leakageBanner = { color: "yellow", icon: AlertTriangle, text: `Below target by ${pct(gap)}. Consider raising your markup.` };
    } else {
      leakageStatus = "red";
      const left = preTax * ((targetMgn - actualMargin) / 100);
      leakageBanner = { color: "red", icon: XCircle, text: `Profit leakage detected. You are leaving $${fmt(left)} on the table.` };
    }
  }

  // Analytics logging — debounce 1.5s after last change
  useEffect(() => {
    if (!hasValues) return;
    clearTimeout(logTimerRef.current);
    logTimerRef.current = setTimeout(async () => {
      try {
        await base44.entities.CalculatorUsage.create({
          labor_hours: h,
          labor_rate: rate,
          labor_burden_percent: burden,
          materials_cost: mats,
          equipment_cost: equip,
          subcontractor_cost: sub,
          overhead_percent: ovhPct,
          markup_percent: mkupPct,
          tax_percent: taxPct,
          target_margin_percent: targetMgn,
          trade_preset: presets.find(p => p.id === selectedPreset)?.preset_name || "",
          true_cost: trueCost,
          client_price: clientPrice,
          profit_dollars: profit,
          actual_margin_percent: actualMargin,
          leakage_status: leakageStatus,
          referrer: document.referrer || "",
          user_agent: navigator.userAgent,
        });
      } catch (_) {}
    }, 1500);
    return () => clearTimeout(logTimerRef.current);
  }, [h, rate, burden, mats, equip, sub, ovhPct, mkupPct, taxPct, targetMgn]);

  const bannerColors = {
    green: "bg-emerald-50 border-emerald-300 text-emerald-800",
    yellow: "bg-amber-50 border-amber-300 text-amber-800",
    red: "bg-red-50 border-red-300 text-red-800",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Free Change Order Profit Calculator",
        "description": "Free calculator shows your true change order profit including labor burden, overhead, and markup.",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web"
      }) }} />

      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-700 flex items-center justify-center">
              <span className="text-white text-xs font-bold">CO</span>
            </div>
            <span className="font-bold text-gray-900 text-sm hidden sm:block">Contractor Profitability Suite</span>
          </Link>
          <Link to="/Billing" className="text-sm text-blue-700 font-medium hover:underline flex items-center gap-1">
            Start Free Trial <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* H1 + subtitle */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Free Change Order Profit Calculator</h1>
          <p className="text-gray-500 text-lg">See your true cost, client price, and actual margin — instantly.</p>
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* LEFT — Inputs */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-gray-900 text-base border-b pb-3">Enter Your Numbers</h2>

            {/* Trade preset */}
            <Field label="Trade Preset">
              <select
                value={selectedPreset}
                onChange={e => applyPreset(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select your trade...</option>
                {presets.map(p => (
                  <option key={p.id} value={p.id}>{p.preset_name}</option>
                ))}
              </select>
            </Field>

            <Field label="Description (optional)">
              <input
                type="text"
                value={inputs.description}
                onChange={e => set("description", e.target.value)}
                placeholder="e.g. Added 2 new circuits"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Labor Hours">
                <NumInput value={inputs.labor_hours} onChange={v => set("labor_hours", v)} placeholder="0" />
              </Field>
              <Field label="Labor Rate ($/hr)">
                <NumInput value={inputs.labor_rate} onChange={v => set("labor_rate", v)} placeholder="65" />
              </Field>
            </div>

            <Field label="Labor Burden %" tooltip="Payroll tax, workers comp, benefits. Typically 22–30%.">
              <NumInput value={inputs.labor_burden_percent} onChange={v => set("labor_burden_percent", v)} placeholder="25" />
            </Field>

            <Field label="Materials Cost ($)">
              <NumInput value={inputs.materials_cost} onChange={v => set("materials_cost", v)} placeholder="0" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Equipment/Rental ($)">
                <NumInput value={inputs.equipment_cost} onChange={v => set("equipment_cost", v)} placeholder="0" />
              </Field>
              <Field label="Subcontractor ($)">
                <NumInput value={inputs.subcontractor_cost} onChange={v => set("subcontractor_cost", v)} placeholder="0" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Overhead %">
                <NumInput value={inputs.overhead_percent} onChange={v => set("overhead_percent", v)} placeholder="10" />
              </Field>
              <Field label="Markup %">
                <NumInput value={inputs.markup_percent} onChange={v => set("markup_percent", v)} placeholder="35" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Sales Tax %">
                <NumInput value={inputs.tax_percent} onChange={v => set("tax_percent", v)} placeholder="0" />
              </Field>
              <Field label="Target Margin %" tooltip="Your profit goal as a percentage of the client price.">
                <NumInput value={inputs.target_margin_percent} onChange={v => set("target_margin_percent", v)} placeholder="25" />
              </Field>
            </div>
          </div>

          {/* RIGHT — Outputs */}
          <div className="flex flex-col gap-4">

            {/* Leakage banner */}
            {leakageBanner && (
              <div className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${bannerColors[leakageBanner.color]}`}>
                <leakageBanner.icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium">{leakageBanner.text}</span>
              </div>
            )}

            {/* Cost breakdown */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 text-base border-b pb-3 mb-4">True Cost Breakdown</h2>
              <div className="space-y-2 text-sm">
                <Row label="Labor (base)" value={`$${fmt(h * rate)}`} />
                <Row label={`Labor Burden (${pct(burden)})`} value={`$${fmt(h * rate * (burden / 100))}`} muted />
                <Row label="Materials" value={`$${fmt(mats)}`} />
                <Row label="Equipment / Rental" value={`$${fmt(equip)}`} />
                <Row label="Subcontractor" value={`$${fmt(sub)}`} />
                <Row label={`Overhead (${pct(ovhPct)})`} value={`$${fmt(overheadAmount)}`} muted />
                <div className="border-t pt-2 mt-2 flex justify-between font-bold text-gray-900">
                  <span>True Cost</span>
                  <span>${fmt(trueCost)}</span>
                </div>
              </div>
            </div>

            {/* Client price */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 text-base border-b pb-3 mb-4">Client Price</h2>
              <div className="space-y-2 text-sm">
                <Row label="True Cost" value={`$${fmt(trueCost)}`} />
                <Row label={`Markup (${pct(mkupPct)})`} value={`+ $${fmt(markupAmount)}`} />
                <Row label={`Sales Tax (${pct(taxPct)})`} value={`+ $${fmt(taxAmount)}`} muted />
                <div className="border-t pt-2 mt-2 flex justify-between font-bold text-blue-700 text-base">
                  <span>Client Price</span>
                  <span>${fmt(clientPrice)}</span>
                </div>
              </div>
            </div>

            {/* Stat boxes */}
            <div className="grid grid-cols-3 gap-3">
              <StatBox
                label="Profit"
                value={`$${fmt(profit)}`}
                color={profit >= 0 ? "green" : "red"}
              />
              <StatBox
                label="Margin"
                value={pct(actualMargin)}
                sub={`target ${pct(targetMgn)}`}
                color={actualMargin >= targetMgn ? "green" : actualMargin >= targetMgn * 0.7 ? "yellow" : "red"}
              />
              <StatBox
                label="$/Labor Hr"
                value={h > 0 ? `$${fmt(profitPerHour)}` : "—"}
                color="blue"
              />
            </div>

            {/* Soft CTAs — only shown when values entered */}
            {hasValues && (
              <>
                {/* CTA box */}
                <div className="rounded-2xl bg-gradient-to-br from-blue-700 to-blue-900 text-white p-5">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 mt-0.5 flex-shrink-0 opacity-80" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm mb-1">Save this calculation?</p>
                      <p className="text-xs text-blue-200 mb-3">Track every change order, flag leakage automatically. Free for 14 days, no card required.</p>
                      <Link
                        to="/Billing"
                        className="inline-block bg-white text-blue-700 font-bold text-sm px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        Start Free Trial →
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Email capture */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Email me this result</span>
                  </div>
                  {emailSent ? (
                    <p className="text-sm text-emerald-600 font-medium flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Check your inbox!</p>
                  ) : emailError ? (
                    <p className="text-sm text-red-600 font-medium flex items-center gap-2"><XCircle className="w-4 h-4" /> {emailError}</p>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={async () => {
                          if (!email.includes("@")) return;
                          setEmailSending(true);
                          try {
                            const resp = await base44.functions.invoke("sendCalculatorResult", {
                              email,
                              results: {
                                true_cost: trueCost,
                                client_price: clientPrice,
                                profit,
                                actual_margin_percent: actualMargin,
                                profit_per_hour: profitPerHour,
                                labor_hours: h,
                              },
                            });
                            if (resp.data?.error) {
                              setEmailError(resp.data.error);
                            } else {
                              setEmailSent(true);
                            }
                          } catch (_) {
                            setEmailError("Failed to send email. Please try again later.");
                          }
                          setEmailSending(false);
                        }}
                        disabled={emailSending}
                        className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50"
                      >
                        {emailSending ? "Sending..." : "Send"}
                      </button>
                    </div>
                  )}
                </div>
                <LeadCapture
                  source="free-change-order-calculator"
                  calcInputs={{ ...inputs }}
                  calcResult={{ true_cost: trueCost, client_price: clientPrice, profit, actual_margin_percent: actualMargin, profit_per_hour: profitPerHour, labor_hours: h }}
                />
              </>
            )}
          </div>
        </div>

        {/* Educational content */}
        <section className="mt-14 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Price a Change Order Correctly</h2>

          <div className="space-y-5 text-gray-700 leading-relaxed">
            <p>
              Most contractors lose money on change orders not because they under-charge on purpose — but because they forget to account for all five layers of cost. A change order that looks like a $2,000 win on paper can easily turn into a break-even or a loss once you factor in the real cost of deploying labor and materials. The difference between a contractor who grows and one who struggles is usually just a consistent habit of running the numbers <em>before</em> sending the price.
            </p>

            <p>
              <strong>The five cost layers you must capture:</strong> First is <em>direct labor</em> — hours times your hourly rate. Second is <em>labor burden</em>, which is the 22–30% on top of wages that covers payroll taxes, workers' compensation insurance, and benefits. This number alone causes more margin erosion than any other single factor. Third is <em>materials and equipment</em> — the raw cost of what goes into the ground or gets consumed on the job. Fourth is <em>subcontractor cost</em>, which should always be marked up to cover your coordination time and risk. Fifth is <em>overhead</em> — the portion of your fixed business expenses (insurance, trucks, office, software) that every job must carry its share of.
            </p>

            <p>
              <strong>Markup versus margin are not the same thing</strong> — and confusing them is one of the most common and costly mistakes in the trades. A 35% markup on cost gives you a 26% margin on revenue, not 35%. If you're quoting a target margin of 30%, you need a markup of approximately 43%. This calculator computes both for you so you always know exactly what your client price means for your bottom line.
            </p>

            <p>
              The best contractors make it a non-negotiable habit: before any change order leaves the office, every cost layer is entered into a calculator, the markup is verified against the target margin, and the result passes a sanity check. It takes two minutes. Over the course of a year, that habit is worth tens of thousands of dollars in recovered profit — money that was already being earned, just not captured correctly.
            </p>
          </div>
        </section>
      </main>

      <footer className="mt-16 border-t bg-white py-6 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Contractor Profitability Suite · <Link to="/PrivacyPolicy" className="hover:underline">Privacy Policy</Link></p>
      </footer>
    </div>
  );
}

function Row({ label, value, muted }) {
  return (
    <div className={`flex justify-between ${muted ? "text-gray-400" : "text-gray-700"}`}>
      <span>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}