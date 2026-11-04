import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

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

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const email = (body.email || "").trim();
    if (!EMAIL_RE.test(email)) {
      return Response.json({ error: "A valid email is required" }, { status: 400 });
    }

    const text = buildBody(body.calc_result, body.source, body.trade);

    await base44.integrations.Core.SendEmail({
      to: email,
      from_name: "Contractor Profitability Suite",
      subject: "Your calculator breakdown + 5 margin leaks most contractors miss",
      text,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("sendLeadWelcome error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}