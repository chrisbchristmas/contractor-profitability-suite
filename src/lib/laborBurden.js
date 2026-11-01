/**
 * Shared labor-burden helpers — the single source of truth for burden math
 * used by time tracking, crew costs, job costing, and the variance engine.
 *
 * Effective burden % = job override ?? company (Customer) default ?? 35.
 * Burdened rate = wage * (1 + burden% / 100).
 */

export const DEFAULT_LABOR_BURDEN_PERCENT = 35;

export function getBurdenPercent(job, customer) {
  const jobOverride = job?.labor_burden_percent;
  if (jobOverride != null && !Number.isNaN(Number(jobOverride))) return Number(jobOverride);
  const cust = customer?.labor_burden_percent;
  if (cust != null && !Number.isNaN(Number(cust))) return Number(cust);
  return DEFAULT_LABOR_BURDEN_PERCENT;
}

export function burdenedRate(wage, burdenPercent) {
  const w = Number(wage) || 0;
  const b = Number(burdenPercent) || 0;
  return w * (1 + b / 100);
}

export function burdenedLaborCost(hours, wage, burdenPercent) {
  const h = Number(hours) || 0;
  return h * burdenedRate(wage, burdenPercent);
}

export function rawLaborCost(hours, wage) {
  return (Number(hours) || 0) * (Number(wage) || 0);
}