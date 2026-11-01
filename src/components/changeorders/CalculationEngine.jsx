/**
 * Core change order calculation engine
 */

export function calculateChangeOrder(data, userDefaults = {}, jobTargetMargin = null) {
  const laborHours = parseFloat(data.labor_hours) || 0;
  const laborRate = parseFloat(data.labor_rate) || 0;
  const laborBurden = parseFloat(
    data.labor_burden_percent != null && data.labor_burden_percent !== ""
      ? data.labor_burden_percent
      : userDefaults.labor_burden_percent ?? 25
  );
  const materialCost = parseFloat(data.material_cost) || 0;
  const equipmentCost = parseFloat(data.equipment_cost) || 0;
  const subcontractorCost = parseFloat(data.subcontractor_cost) || 0;
  const markupPercent = parseFloat(
    data.markup_percent != null && data.markup_percent !== ""
      ? data.markup_percent
      : userDefaults.default_markup_percent ?? 35
  );
  const overheadPercent = parseFloat(
    data.overhead_percent != null && data.overhead_percent !== ""
      ? data.overhead_percent
      : userDefaults.default_overhead_percent ?? 10
  );
  const taxPercent = parseFloat(data.tax_percent) || 0;
  const targetMargin = parseFloat(
    jobTargetMargin != null ? jobTargetMargin : userDefaults.target_margin_percent ?? 30
  );

  // Detailed labour burden breakdown
  const baseHourlyWage = parseFloat(data.base_hourly_wage) || 0;
  const payrollTaxPercent = parseFloat(data.payroll_tax_percent) || 0;
  const workersCompPercent = parseFloat(data.workers_comp_percent) || 0;
  const generalLiabilityPercent = parseFloat(data.general_liability_percent) || 0;
  const benefitsPercent = parseFloat(data.benefits_percent) || 0;
  const burdenCalculated = baseHourlyWage > 0;

  const burdenAmountPerHour = burdenCalculated
    ? baseHourlyWage * (payrollTaxPercent + workersCompPercent + generalLiabilityPercent + benefitsPercent) / 100
    : 0;
  const fullyLoadedRate = burdenCalculated
    ? baseHourlyWage + burdenAmountPerHour
    : 0;
  const totalLaborBurdenCost = burdenCalculated
    ? fullyLoadedRate * laborHours
    : 0;

  // Core calculations — use detailed burden cost when available, else legacy formula
  const trueLaborCost = burdenCalculated
    ? totalLaborBurdenCost
    : laborHours * laborRate * (1 + laborBurden / 100);
  const subtotalBeforeOverhead = trueLaborCost + materialCost + equipmentCost + subcontractorCost;
  const overheadAmount = (overheadPercent / 100) * subtotalBeforeOverhead;
  const totalCost = subtotalBeforeOverhead + overheadAmount;
  const sellPrice = totalCost * (1 + markupPercent / 100);
  const taxAmount = (taxPercent / 100) * sellPrice;
  const finalPriceToClient = sellPrice + taxAmount;
  const trueMarginPercent = sellPrice > 0 ? ((sellPrice - totalCost) / sellPrice) * 100 : 0;
  const targetSellPrice = targetMargin < 100 && totalCost > 0 ? totalCost / (1 - targetMargin / 100) : totalCost;
  const leakageAmount = Math.max(0, targetSellPrice - sellPrice);

  // 2️⃣ Smart Markup Recommendation
  const requiredMarkupForTarget = totalCost > 0
    ? ((targetSellPrice - totalCost) / totalCost) * 100
    : 0;
  const markupRecommendationStatus = markupPercent < requiredMarkupForTarget
    ? `Increase markup to ${requiredMarkupForTarget.toFixed(1)}% to hit ${targetMargin}% margin`
    : "Markup sufficient";

  // 5️⃣ Material Inflation
  const baselineMaterial = parseFloat(data.baseline_material_cost) || 0;
  const materialVariance = baselineMaterial > 0 ? materialCost - baselineMaterial : 0;
  const materialVariancePercent = baselineMaterial > 0 ? (materialVariance / baselineMaterial) * 100 : 0;

  // 7️⃣ Labor Efficiency
  const estimatedLaborHours = parseFloat(data.estimated_labor_hours) || 0;
  const actualLaborHours = parseFloat(data.actual_labor_hours) || 0;
  const laborEfficiencyPercent = estimatedLaborHours > 0 ? (actualLaborHours / estimatedLaborHours) * 100 : 0;

  // 9️⃣ Cash Flow
  const paymentDueDays = parseFloat(data.payment_due_days) || null;

  // Flags
  const flags = [];
  if (trueMarginPercent < targetMargin && sellPrice > 0) {
    flags.push({
      flag_type: "margin_below_target",
      flag_message: `Margin below target by $${leakageAmount.toFixed(2)}`
    });
  }
  if (markupPercent < 20) {
    flags.push({ flag_type: "markup_below_minimum", flag_message: "Markup below recommended minimum (20%)" });
  }
  if (!burdenCalculated) {
    flags.push({ flag_type: "burden_missing", flag_message: "Missing Burden - labour burden not calculated" });
  }
  if (laborEfficiencyPercent > 100 && estimatedLaborHours > 0) {
    flags.push({ flag_type: "labor_over_estimate", flag_message: `Labor exceeded estimate by ${(laborEfficiencyPercent - 100).toFixed(1)}%` });
  }
  if (materialVariancePercent > 10) {
    flags.push({ flag_type: "material_inflation", flag_message: `Material costs up ${materialVariancePercent.toFixed(1)}% from baseline` });
  }

  return {
    true_labor_cost: r2(trueLaborCost),
    subtotal_before_overhead: r2(subtotalBeforeOverhead),
    overhead_amount: r2(overheadAmount),
    total_cost: r2(totalCost),
    sell_price: r2(sellPrice),
    tax_amount: r2(taxAmount),
    final_price_to_client: r2(finalPriceToClient),
    true_margin_percent: r2(trueMarginPercent),
    target_margin: r2(targetMargin),
    target_sell_price: r2(targetSellPrice),
    leakage_amount: r2(leakageAmount),
    required_markup_for_target: r2(requiredMarkupForTarget),
    markup_recommendation_status: markupRecommendationStatus,
    material_variance: r2(materialVariance),
    material_variance_percent: r2(materialVariancePercent),
    labor_efficiency_percent: r2(laborEfficiencyPercent),
    payment_due_days: paymentDueDays,
    flags,
    laborBurdenUsed: r2(laborBurden),
    markupUsed: r2(markupPercent),
    overheadUsed: r2(overheadPercent),
    burden_calculated: burdenCalculated,
    burden_amount_per_hour: r2(burdenAmountPerHour),
    fully_loaded_rate: r2(fullyLoadedRate),
    total_labor_burden_cost: r2(totalLaborBurdenCost),
  };
}

// Job-level margin rollup
export function calculateJobMargins(job, changeOrders) {
  const approved = changeOrders.filter(co => co.status === "approved");
  const totalApprovedRevenue = approved.reduce((s, co) => s + (co.final_price_to_client || 0), 0);
  const totalApprovedCost = approved.reduce((s, co) => s + (co.total_cost || 0), 0);
  const adjustedRevenue = (job.contract_value || 0) + totalApprovedRevenue;
  const adjustedCost = (job.estimated_cost || 0) + totalApprovedCost;
  const realTimeMargin = adjustedRevenue > 0 ? ((adjustedRevenue - adjustedCost) / adjustedRevenue) * 100 : 0;

  // 1️⃣ Total Job Profit
  const totalJobProfit = adjustedRevenue - adjustedCost;

  // 6️⃣ Risk Score
  const targetMargin = job.target_margin_percent ?? 30;
  const riskScore = realTimeMargin < targetMargin ? 80
    : realTimeMargin < targetMargin + 5 ? 50 : 10;
  const riskLabel = riskScore >= 80 ? "High Risk" : riskScore >= 50 ? "Moderate Risk" : "Low Risk";
  const riskColor = riskScore >= 80 ? "text-red-600" : riskScore >= 50 ? "text-amber-600" : "text-emerald-600";

  // 1️⃣0️⃣ Profit Per Hour
  const totalEstimatedHours = job.total_estimated_hours || 0;
  const profitPerHour = totalEstimatedHours > 0 ? totalJobProfit / totalEstimatedHours : null;

  // 1️⃣2️⃣ Industry Benchmark
  const industryAvgMargin = 28;
  const performanceVsIndustry = r2(realTimeMargin - industryAvgMargin);

  return {
    totalApprovedRevenue: r2(totalApprovedRevenue),
    totalApprovedCost: r2(totalApprovedCost),
    adjustedRevenue: r2(adjustedRevenue),
    adjustedCost: r2(adjustedCost),
    realTimeMargin: r2(realTimeMargin),
    totalJobProfit: r2(totalJobProfit),
    riskScore,
    riskLabel,
    riskColor,
    profitPerHour: profitPerHour !== null ? r2(profitPerHour) : null,
    performanceVsIndustry,
    industryAvgMargin,
  };
}

// 3️⃣ Projected job margin after a pending CO approval
export function calculateProjectedJobMargin(job, existingChangeOrders, pendingCO) {
  const { adjustedRevenue, adjustedCost } = calculateJobMargins(job, existingChangeOrders);
  const coRevenue = pendingCO.final_price_to_client || pendingCO.sell_price || 0;
  const coCost = pendingCO.total_cost || 0;
  const newRevenue = adjustedRevenue + coRevenue;
  const newCost = adjustedCost + coCost;
  const projectedMargin = newRevenue > 0 ? ((newRevenue - newCost) / newRevenue) * 100 : 0;
  const currentMargin = calculateJobMargins(job, existingChangeOrders).realTimeMargin;
  const marginDrop = currentMargin - projectedMargin;
  return {
    projectedMargin: r2(projectedMargin),
    marginDrop: r2(marginDrop),
  };
}

// 4️⃣ Profit At Risk — draft COs under target
export function calculateProfitAtRisk(changeOrders, targetMargin) {
  return changeOrders
    .filter(co => co.status === "draft" && (co.true_margin_percent || 0) < (co.target_margin || targetMargin))
    .reduce((s, co) => s + (co.leakage_amount || 0), 0);
}

// Job-level direct cost calculations (from raw job fields).
// burdenPercent applies labor burden to the wage cost. When omitted, falls
// back to the per-job override (job.labor_burden_percent), else 0 (raw wage).
export function calculateJobDirectMetrics(job, burdenPercent) {
  const contractPrice = job.contract_value || job.contract_price || 0;
  const bp = burdenPercent != null
    ? Number(burdenPercent) || 0
    : (job.labor_burden_percent != null ? Number(job.labor_burden_percent) || 0 : 0);
  const laborCostRaw = (job.actual_labor_hours || 0) * (job.labor_rate || 0);
  const laborCost = laborCostRaw * (1 + bp / 100);
  const totalCost = laborCost + (job.material_cost || 0) + (job.subcontractor_cost || 0) + (job.overhead_cost || 0);
  const profit = contractPrice - totalCost;
  const marginPercent = contractPrice > 0 ? (profit / contractPrice) * 100 : 0;
  const actualHours = job.actual_labor_hours || job.total_estimated_hours || 0;
  const profitPerHour = actualHours > 0 ? profit / actualHours : 0;
  return { contractPrice, laborCost, laborCostRaw, burdenPercent: bp, totalCost, profit, marginPercent, profitPerHour };
}

// Profit Forecast Engine
export function calculateProfitForecast(job, burdenPercent) {
  const contractPrice = job.contract_value || job.contract_price || 0;
  const { totalCost } = calculateJobDirectMetrics(job, burdenPercent);
  const estimatedRemaining = job.estimated_remaining_costs || 0;
  const projectedTotalCost = totalCost + estimatedRemaining;
  const projectedProfit = contractPrice - projectedTotalCost;
  const projectedMargin = contractPrice > 0 ? (projectedProfit / contractPrice) * 100 : 0;
  return {
    projectedTotalCost: r2(projectedTotalCost),
    projectedProfit: r2(projectedProfit),
    projectedMargin: r2(projectedMargin),
  };
}

// Profit Health Score
export function calculateProfitHealthScore(job) {
  const { marginPercent, profitPerHour } = calculateJobDirectMetrics(job);
  const targetProfitPerHour = job.target_profit_per_hour || 50;
  const score = Math.min(100, Math.max(0,
    (marginPercent * 0.5) + ((profitPerHour / targetProfitPerHour) * 50)
  ));
  const level = score < 41 ? "Critical" : score < 71 ? "Moderate" : "Healthy";
  const color = score < 41 ? "text-red-600" : score < 71 ? "text-amber-500" : "text-emerald-600";
  const bg = score < 41 ? "bg-red-50 border-red-200" : score < 71 ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200";
  return { score: r2(score), level, color, bg };
}

// Estimate vs Actual Analysis
export function calculateEstimateVariance(estimate, job) {
  const estimatedCost = (estimate.estimated_labor_cost || 0) + (estimate.estimated_material_cost || 0) +
    (estimate.estimated_subcontractor_cost || 0) + (estimate.estimated_overhead || 0);
  const { totalCost } = calculateJobDirectMetrics(job);
  const costVariance = totalCost - estimatedCost;
  const variancePercent = estimatedCost > 0 ? (costVariance / estimatedCost) * 100 : 0;
  return { estimatedCost: r2(estimatedCost), actualCost: r2(totalCost), costVariance: r2(costVariance), variancePercent: r2(variancePercent) };
}

// Job Profit Ranking — sort by profit_per_hour DESC
export function rankJobsByProfitability(jobs) {
  return jobs
    .map(job => ({ ...job, _metrics: calculateJobDirectMetrics(job) }))
    .sort((a, b) => b._metrics.profitPerHour - a._metrics.profitPerHour);
}

// Contractor Performance Summary
export function calculateContractorPerformance(jobs, changeOrders) {
  const activeJobs = jobs.filter(j => (j.status || j.job_status) === "active");
  const jobsAtRisk = jobs.filter(j => j.profit_alerts && j.profit_alerts.trim() !== "");
  const totalRevenue = jobs.reduce((s, j) => s + (j.contract_value || j.contract_price || 0), 0);
  const totalProfit = jobs.reduce((s, j) => {
    const { profit } = calculateJobDirectMetrics(j);
    return s + profit;
  }, 0);
  const margins = jobs.map(j => calculateJobDirectMetrics(j).marginPercent).filter(m => m > 0);
  const avgMargin = margins.length > 0 ? margins.reduce((s, m) => s + m, 0) / margins.length : 0;
  return {
    totalRevenue: r2(totalRevenue),
    totalProfit: r2(totalProfit),
    avgMargin: r2(avgMargin),
    activeJobCount: activeJobs.length,
    jobsAtRiskCount: jobsAtRisk.length,
  };
}

// 9️⃣ Cash Flow: upcoming collections
export function calculateUpcomingCollections(changeOrders, days = 14) {
  const now = new Date();
  const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return changeOrders
    .filter(co => {
      if (!co.payment_due_days || co.status !== "approved") return false;
      const dueDate = new Date(new Date(co.created_date).getTime() + co.payment_due_days * 24 * 60 * 60 * 1000);
      return dueDate <= cutoff;
    })
    .reduce((s, co) => s + (co.final_price_to_client || 0), 0);
}

function r2(n) {
  return Math.round((n || 0) * 100) / 100;
}