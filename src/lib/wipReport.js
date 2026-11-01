/**
 * WIP (Work-in-Progress) over/under-billing computation.
 * Pure functions shared by the WipReport page so the math stays
 * in one place and is easy to verify.
 *
 * Sign convention (per spec):
 *   position = billed - earned
 *   positive => overbilled  (billing ahead of work — a liability)
 *   negative => underbilled (work done but not billed — unbilled receivable)
 *
 * Burdened labor (Phase 2) is used in actual costs via computeCategoryActuals.
 * Approved change orders are included in BOTH contract value and estimated cost.
 */
import {
  computeCategoryActuals,
  computeCategoryEstimates,
} from "@/lib/jobVariance";

const sum = (arr, sel) => (arr || []).reduce((s, x) => s + (sel(x) || 0), 0);

/** Approved change orders' revenue (sell price added to contract value). */
export function approvedCORevenue(changeOrders) {
  return sum(
    (changeOrders || []).filter((co) => co.status === "approved"),
    (co) => co.final_price_to_client || co.sell_price || 0
  );
}

/** Approved change orders' cost (added to estimated total cost). */
export function approvedCOCost(changeOrders) {
  return sum(
    (changeOrders || []).filter((co) => co.status === "approved"),
    (co) =>
      co.total_cost ||
      (Number(co.material_cost) || 0) +
        (Number(co.subcontractor_cost) || 0) +
        (Number(co.equipment_cost) || 0) +
        (Number(co.true_labor_cost) || 0) +
        (Number(co.total_labor_burden_cost) || 0)
  );
}

/** Total amount billed to date from non-draft invoices for a job. */
export function billedToDate(invoices, jobId) {
  return sum(
    (invoices || []).filter(
      (inv) => inv.job_id === jobId && inv.status && inv.status !== "draft"
    ),
    (inv) => inv.total_amount || 0
  );
}

/**
 * Compute a single WIP row.
 * @returns row object with all display + breakdown fields.
 */
export function computeWipRow(
  job,
  changeOrders,
  invoices,
  timeEntries,
  crewCosts,
  expenses,
  burdenPercent
) {
  const coRev = approvedCORevenue(changeOrders);
  const coCost = approvedCOCost(changeOrders);
  const contractValue =
    (Number(job.contract_value) || Number(job.contract_price) || 0) + coRev;

  // Estimated total cost: prefer the job-level estimate, else sum category estimates.
  const catEst = computeCategoryEstimates(job);
  const catEstTotal =
    catEst.labor + catEst.materials + catEst.subcontractor + catEst.equipment_other;
  const baseEstimate =
    Number(job.estimated_cost) > 0 ? Number(job.estimated_cost) : catEstTotal;
  const estimatedTotalCost = baseEstimate + coCost;

  // Actual cost to date (burdened labor + materials + sub + equipment).
  const actuals = computeCategoryActuals(job, timeEntries, crewCosts, expenses, burdenPercent);
  const actualCostToDate =
    actuals.labor + actuals.materials + actuals.subcontractor + actuals.equipment_other;

  // Percent complete: manual override wins, else cost-to-cost capped at 100%.
  const override = job.wip_pct_complete_override;
  const hasOverride =
    override != null && !Number.isNaN(Number(override)) && Number(override) >= 0;
  let pctComplete;
  let pctSource;
  if (hasOverride) {
    pctComplete = Math.min(Math.max(Number(override), 0), 100);
    pctSource = "manual";
  } else {
    pctComplete =
      estimatedTotalCost > 0
        ? Math.min((actualCostToDate / estimatedTotalCost) * 100, 100)
        : 0;
    pctSource = "cost-to-cost";
  }

  const earnedRevenue = contractValue * (pctComplete / 100);
  const billed = billedToDate(invoices, job.id);
  const overUnderBilled = billed - earnedRevenue; // +overbilled / -underbilled

  return {
    id: job.id,
    job_name: job.job_name,
    contract_value: contractValue,
    estimated_total_cost: estimatedTotalCost,
    actual_cost_to_date: actualCostToDate,
    pct_complete: pctComplete,
    pct_source: pctSource,
    has_override: hasOverride,
    earned_revenue: earnedRevenue,
    billed_to_date: billed,
    over_under_billed: overUnderBilled,
    is_underbilled: overUnderBilled < 0,
    is_overbilled: overUnderBilled > 0,
    co_revenue: coRev,
    co_cost: coCost,
    base_estimate: baseEstimate,
    breakdown: {
      labor: actuals.labor,
      labor_raw: actuals._laborRaw,
      materials: actuals.materials,
      subcontractor: actuals.subcontractor,
      equipment_other: actuals.equipment_other,
    },
  };
}

/** Sum a set of rows into a totals object. */
export function computeWipTotals(rows) {
  return {
    contract_value: sum(rows, (r) => r.contract_value),
    estimated_total_cost: sum(rows, (r) => r.estimated_total_cost),
    actual_cost_to_date: sum(rows, (r) => r.actual_cost_to_date),
    earned_revenue: sum(rows, (r) => r.earned_revenue),
    billed_to_date: sum(rows, (r) => r.billed_to_date),
    over_under_billed: sum(rows, (r) => r.over_under_billed),
  };
}