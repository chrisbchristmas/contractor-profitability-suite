/**
 * QuickBooks-compatible exports (Option C fallback).
 * Pure CSV builders + a browser download helper. No external deps.
 *
 * (1) invoicesToQboCsv — invoices in QuickBooks Online's invoice
 *     import CSV layout (Customer, Invoice No., Invoice Date, Due Date,
 *     Terms, Item, Description, Qty, Rate, Amount). Expand line_items;
 *     fall back to a single summary line when an invoice has none.
 *
 * (2) jobCostsToCsv — job cost summary for the accountant:
 *     per-job category totals with burdened labor, % complete, earned,
 *     billed, and over/under-billed position (mirrors the WIP report).
 */

function escapeCsv(value) {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(rows) {
  return rows.map((r) => r.map(escapeCsv).join(",")).join("\r\n");
}

const dateStr = (d) =>
  d ? new Date(d).toISOString().split("T")[0] : "";

/** Invoices → QuickBooks Online invoice import CSV. */
export function invoicesToQboCsv(invoices, jobs = []) {
  const jobById = Object.fromEntries(jobs.map((j) => [j.id, j]));
  const header = [
    "Customer",
    "Invoice No.",
    "Invoice Date",
    "Due Date",
    "Terms",
    "Item",
    "Description",
    "Qty",
    "Rate",
    "Amount",
  ];
  const rows = [header];

  (invoices || [])
    .filter((inv) => inv.status && inv.status !== "draft")
    .forEach((inv) => {
      const job = inv.job_id ? jobById[inv.job_id] : null;
      const customer = inv.client_name || job?.client_name || job?.job_name || "Customer";
      const invNo = inv.invoice_number || `INV-${(inv.id || "").slice(-6).toUpperCase()}`;
      const invDate = dateStr(inv.sent_date || inv.created_date);
      const due = dateStr(inv.due_date);

      const lines = inv.line_items && inv.line_items.length
        ? inv.line_items
        : [{ description: "Construction Services", qty: 1, rate: inv.total_amount, amount: inv.total_amount }];

      lines.forEach((li) => {
        const qty = li.qty != null ? li.qty : 1;
        const rate = li.rate != null ? Number(li.rate) : (Number(li.amount) || 0) / (Number(qty) || 1);
        const amount = li.amount != null ? li.amount : rate * qty;
        rows.push([
          customer,
          invNo,
          invDate,
          due,
          "",
          "Construction Services",
          li.description || "",
          qty,
          Number(rate).toFixed(2),
          Number(amount).toFixed(2),
        ]);
      });
    });

  return toCsv(rows);
}

/** WIP rows → job cost summary CSV for the accountant. */
export function jobCostsToCsv(rows = [], burdenPercent = 0) {
  const header = [
    "Job Name",
    "Contract Value",
    "Est. Total Cost",
    "Actual Cost to Date",
    "% Complete",
    "Labor (Burdened)",
    "Materials",
    "Subcontractor",
    "Equipment / Other",
    "Earned Revenue",
    "Billed to Date",
    "Over/(Under) Billed",
    "Burden %",
  ];
  const out = [header];
  const $ = (n) => (Number(n) || 0).toFixed(2);
  const p = (n) => `${(Number(n) || 0).toFixed(1)}%`;

  rows.forEach((r) => {
    out.push([
      r.job_name || "",
      $(r.contract_value),
      $(r.estimated_total_cost),
      $(r.actual_cost_to_date),
      p(r.pct_complete),
      $(r.breakdown?.labor),
      $(r.breakdown?.materials),
      $(r.breakdown?.subcontractor),
      $(r.breakdown?.equipment_other),
      $(r.earned_revenue),
      $(r.billed_to_date),
      $(r.over_under_billed),
      p(burdenPercent),
    ]);
  });

  // Totals row
  const tot = rows.reduce(
    (a, r) => ({
      cv: a.cv + (r.contract_value || 0),
      ec: a.ec + (r.estimated_total_cost || 0),
      ac: a.ac + (r.actual_cost_to_date || 0),
      er: a.er + (r.earned_revenue || 0),
      bd: a.bd + (r.billed_to_date || 0),
      ou: a.ou + (r.over_under_billed || 0),
      lb: a.lb + (r.breakdown?.labor || 0),
      mt: a.mt + (r.breakdown?.materials || 0),
      sb: a.sb + (r.breakdown?.subcontractor || 0),
      eq: a.eq + (r.breakdown?.equipment_other || 0),
    }),
    { cv: 0, ec: 0, ac: 0, er: 0, bd: 0, ou: 0, lb: 0, mt: 0, sb: 0, eq: 0 }
  );
  out.push([
    "TOTALS",
    $(tot.cv),
    $(tot.ec),
    $(tot.ac),
    "",
    $(tot.lb),
    $(tot.mt),
    $(tot.sb),
    $(tot.eq),
    $(tot.er),
    $(tot.bd),
    $(tot.ou),
    "",
  ]);

  return toCsv(out);
}

/** Trigger a browser download of a text payload. */
export function triggerDownload(filename, content, mime = "text/csv;charset=utf-8;") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}