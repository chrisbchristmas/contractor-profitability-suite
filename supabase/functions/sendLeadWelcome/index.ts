import { sendEmail } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { rateLimited, tooMany } from '../_shared/security.ts';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MARGIN_LEAKS = [
  "Labor burden under-counted - payroll taxes, workers comp, and benefits add 20-35% on top of wages; contractors who skip it underprice every job.",
  "Unbilled change orders - extra work done without a priced, approved change order is pure profit leakage.",
  "Overhead not allocated per job - trucks, insurance, software, and office costs must be spread across jobs or margins are overstated.",
  "Markup vs margin confusion - a 25% markup is only a 20% margin; quoting from markup when you mean margin quietly erodes profit.",
  "No job-level tracking - without per-job cost tracking, losing jobs hide inside profitable ones until year-end.",
];

function fmtVal(v) {
  if (v === null || v === undefined || v === "") return String(v ?? "");
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(2);
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function buildBody(calcResult, source, trade) {
  const lines = [];
  lines.push("Here is the breakdown from the calculator you used on Contractor Profitability Suite.");
  if (source) lines.push(`Calculator: ${source}`);
  if (trade) lines.push(`Trade: ${trade}`);
  lines.push("");
  lines.push("YOUR RESULTS");
  if (calcResult && typeof calcResult === "object") {
    for (const [k, v] of Object.entries(calcResult)) {
      lines.push(`- ${k.replace(/_/g, " ")}: ${fmtVal(v)}`);
    }
  } else {
    lines.push("- (no results captured)");
  }
  lines.push("");
  lines.push("THE 5 MARGIN LEAKS MOST CONTRACTORS MISS");
  MARGIN_LEAKS.forEach((l, i) => lines.push(`${i + 1}. ${l}`));
  lines.push("");
  lines.push("Start your free 14-day trial - no card required:");
  lines.push("https://contractorprofitabilitysuite.com/register");
  return lines.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    if (rateLimited(req, 'sendLeadWelcome', 3, 60 * 60_000)) return tooMany(corsHeaders);
    const body = await req.json();
    const email = (body.email || "").trim();
    if (!EMAIL_RE.test(email) || email.length > 254) {
      return Response.json({ error: "A valid email is required" }, { status: 400, headers: corsHeaders });
    }

    // Public endpoint sends from our domain: only numbers and short plain labels, so it can't relay spam/phishing links.
    const label = (v) => (typeof v === "string" && /^[\w\s&()%-]{1,60}$/.test(v) ? v : "");
    const calc = Object.fromEntries(Object.entries(body.calc_result && typeof body.calc_result === "object" ? body.calc_result : {})
      .filter(([k, v]) => label(k) && (typeof v === "number" ? Number.isFinite(v) : label(v))).slice(0, 25));
    const text = buildBody(calc, label(body.source), label(body.trade));

    await sendEmail({
      to: email,
      from_name: "Contractor Profitability Suite",
      subject: "Your calculator breakdown + 5 margin leaks most contractors miss",
      text,
      body: `<pre style="font-family:inherit;white-space:pre-wrap;">${text.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</pre>`,
    });

    return Response.json({ ok: true }, { headers: corsHeaders });
  } catch (error) {
    console.error("sendLeadWelcome error:", error);
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500, headers: corsHeaders });
  }
});
