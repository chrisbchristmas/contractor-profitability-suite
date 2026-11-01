/**
 * Estimate-vs-Actual variance engine (client-side, for live display).
 * Mirrors the math in the checkProfitLeakage backend function so the
 * JobDetail banner/panel and the persisted profit_alerts stay in sync.
 */
import { burdenedLaborCost, rawLaborCost } from "@/lib/laborBurden";

export const COST_CATEGORIES = [
  { key: "labor", label: "Labor" },
  { key: "materials", label: "Materials" },
  { key: "subcontractor", label: "Subcontractor" },
  { key: "equipment_other", label: "Equipment / Other" },
];

export const DEFAULT_VARIANCE_THRESHOLD = 8;

function sum(arr, sel) {
  return (arr || []).reduce((s, x) => s + (sel(x) || 0), 0);
}

/** Actual cost per category from all accruing sources. */
export function computeCategoryActuals(job, timeEntries, crewCosts, expenses, burdenPercent) {
  const laborRawFromTime = sum(timeEntries, (e) => rawLaborCost(e.hours, e.labor_rate));
  const laborFromTime = sum(timeEntries, (e) => burdenedLaborCost(e.hours, e.labor_rate, burdenPercent));
  const employeeCrews = (crewCosts || []).filter((c) => c.worker_type === "Employee");
  const laborFromCrew = sum(employeeCrews, (c) => burdenedLaborCost(c.hours_worked, c.hourly_rate, burdenPercent));
  const laborRawFromCrew = sum(employeeCrews, (c) => rawLaborCost(c.hours_worked, c.hourly_rate));
  const laborFromExp = sum((expenses || []).filter((x) => x.category === "labor"), (x) => x.amount);

  const subCrews = (crewCosts || []).filter((c) => c.worker_type === "Subcontractor");
  const subcontractor = sum(subCrews, (c) => c.total_cost || c.quoted_amount || 0)
    + sum((expenses || []).filter((x) => x.category === "subcontractor"), (x) => x.amount);

  const materials = sum((expenses || []).filter((x) => x.category === "materials"), (x) => x.amount);
  const equipment_other = sum((expenses || []).filter((x) => x.category === "equipment_other"), (x) => x.amount);

  return {
    labor: laborFromTime + laborFromCrew + laborFromExp,
    materials,
    subcontractor,
    equipment_other,
    _laborRaw: laborRawFromTime + laborRawFromCrew, // raw wage cost (pre-burden), for display
  };
}

/** Estimated cost per category (with sensible fallbacks). */
export function computeCategoryEstimates(job) {
  const labor =
    job.estimated_labor_cost != null
      ? Number(job.estimated_labor_cost) || 0
      : (Number(job.estimated_labor_hours) || 0) * (Number(job.labor_rate) || 0);
  return {
    labor,
    materials: Number(job.estimated_material_cost) || 0,
    subcontractor: Number(job.estimated_subcontractor_cost) || 0,
    equipment_other: Number(job.estimated_equipment_cost) || 0,
  };
}

/** Labor % complete (0..1) used as the job-progress proxy for projections. */
export function computeLaborPctComplete(job, timeEntries, crewCosts) {
  const estHours = Number(job.estimated_labor_hours) || 0;
  if (estHours <= 0) return null;
  const actualHours =
    sum(timeEntries, (e) => e.hours) +
    sum((crewCosts || []).filter((c) => c.worker_type === "Employee"), (c) => c.hours_worked);
  if (actualHours <= 0) return null;
  return Math.min(actualHours / estHours, 1);
}

/**
 * Full variance + projected-margin computation.
 * @returns { categories, totalActual, totalEstimated, projectedTotalCost,
 *            projectedMargin, currentMargin, adjustedRevenue, jobPctComplete, alerts }
 */
export function computeJobVariance(job, changeOrders, timeEntries, crewCosts, expenses, burdenPercent, thresholdPercent) {
  const threshold = Number(thresholdPercent) ?? DEFAULT_VARIANCE_THRESHOLD;
  const actuals = computeCategoryActuals(job, timeEntries, crewCosts, expenses, burdenPercent);
  const estimates = computeCategoryEstimates(job);

  const approvedCOs = (changeOrders || []).filter((co) => co.status === "approved");
  const coRevenue = sum(approvedCOs, (co) => co.final_price_to_client || co.sell_price || 0);
  const adjustedRevenue = (Number(job.contract_value) || Number(job.contract_price) || 0) + coRevenue;

  const totalActual = actuals.labor + actuals.materials + actuals.subcontractor + actuals.equipment_other;
  const totalEstimated = estimates.labor + estimates.materials + estimates.subcontractor + estimates.equipment_other;

  const jobPctComplete = computeLaborPctComplete(job, timeEntries, crewCosts);
  const projectFactor = jobPctComplete != null && jobPctComplete > 0 && jobPctComplete < 1 ? 1 / jobPctComplete : 1;

  const categories = COST_CATEGORIES.map(({ key, label }) => {
    const est = estimates[key];
    const act = actuals[key];
    const over = est > 0 ? (act - est) / est : 0; // positive = over estimate
    const overPct = est > 0 ? over * 100 : 0;
    const isOver = est > 0 && act > est * (1 + threshold / 100);
    const projected = key === "labor" ? act * projectFactor : (est > 0 ? act * projectFactor : act);
    return { key, label, estimated: est, actual: act, over, overPct, isOver, projected,
      laborRaw: key === "labor" ? actuals._laborRaw : null };
  });

  const projectedTotalCost = categories.reduce((s, c) => s + c.projected, 0);
  const currentMargin = adjustedRevenue > 0 ? ((adjustedRevenue - totalActual) / adjustedRevenue) * 100 : 0;
  const projectedMargin = adjustedRevenue > 0 ? ((adjustedRevenue - projectedTotalCost) / adjustedRevenue) * 100 : 0;

  const alerts = categories
    .filter((c) => c.isOver)
    .map((c) => ({
      category: c.key,
      label: c.label,
      overPct: c.overPct,
      message: `${c.label} tracking ${c.overPct.toFixed(0)}% over estimate`,
    }));

  return {
    categories,
    totalActual,
    totalEstimated,
    projectedTotalCost,
    projectedMargin,
    currentMargin,
    adjustedRevenue,
    jobPctComplete,
    alerts,
    threshold,
  };
}

/** Compose the profit_alerts string for a job (variance alerts only). */
export function varianceAlertStrings(variance) {
  return variance.alerts.map((a) => a.message);
}