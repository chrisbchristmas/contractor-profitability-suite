// Minimal RFC4180-ish CSV parser: quoted fields, "" escapes, CRLF. Headers -> snake_case keys.
export function parseCSV(text) {
  const rows = [];
  let row = [], field = "", q = false;
  const s = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"' && s[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((v) => v.trim() !== "")) rows.push(row);
  if (!rows.length) return [];
  const keys = rows[0].map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""));
  return rows.slice(1).map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

const num = (v) => parseFloat(String(v ?? "").replace(/[$,\s]/g, ""));

// CSV row -> Job payload, or null if it lacks the required name/contract/cost.
export function csvRowToJob(r) {
  const job_name = r.job_name || r.name || r.job;
  const contract_value = num(r.contract_value ?? r.contract ?? r.price);
  const estimated_cost = num(r.estimated_cost ?? r.cost ?? r.budget);
  if (!job_name || !(contract_value >= 0) || !(estimated_cost >= 0)) return null;
  const job = { job_name, client_name: r.client_name || r.client || "", contract_value, estimated_cost, status: "active" };
  if (/^\d{4}-\d{2}-\d{2}$/.test(r.start_date || "")) job.start_date = r.start_date;
  const tm = num(r.target_margin_percent ?? r.target_margin);
  if (tm >= 0) job.target_margin_percent = tm;
  return job;
}
