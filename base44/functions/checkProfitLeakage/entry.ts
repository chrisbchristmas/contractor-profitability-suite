import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DEFAULT_VARIANCE_THRESHOLD = 8;
const DEFAULT_BURDEN_PERCENT = 35;

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized: user authentication required' }, { status: 401 });
    }

    const b = base44.asServiceRole;

    const jobId = body.job_id;
    if (!jobId) return Response.json({ error: 'job_id required' }, { status: 400 });

    const jobs = await b.entities.Job.filter({ id: jobId });
    const job = jobs[0];
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });

    // Verify caller owns this job
    const isJobOwner = job.user_id === user.id || job.assigned_user_id === user.id || job.created_by_id === user.id;
    if (user.role !== 'admin' && !isJobOwner) {
      return Response.json({ error: 'Forbidden: you do not have access to this job' }, { status: 403 });
    }

    // Pull company defaults from the owner's Customer record (for burden + threshold)
    let customer = null;
    if (job.created_by_id || job.user_id) {
      const ownerEmailOrId = job.user_id || job.created_by_id;
      const byEmail = await b.entities.Customer.filter({ email: user.email });
      customer = byEmail?.[0] || null;
    }
    const burdenPercent = (job.labor_burden_percent != null ? Number(job.labor_burden_percent)
      : (customer?.labor_burden_percent != null ? Number(customer.labor_burden_percent) : DEFAULT_BURDEN_PERCENT)) || 0;
    const threshold = (job.variance_alert_threshold_percent != null ? Number(job.variance_alert_threshold_percent)
      : (customer?.variance_alert_threshold_percent != null ? Number(customer.variance_alert_threshold_percent) : DEFAULT_VARIANCE_THRESHOLD)) || DEFAULT_VARIANCE_THRESHOLD;

    // ---- Burdened direct costs (existing logic, now burden-applied) ----
    const contractPrice = job.contract_value || job.contract_price || 0;
    const laborCostRaw = (job.actual_labor_hours || 0) * (job.labor_rate || 0);
    const laborCost = laborCostRaw * (1 + burdenPercent / 100);
    const totalCost = laborCost + (job.material_cost || 0) + (job.subcontractor_cost || 0) + (job.overhead_cost || 0);
    const profit = contractPrice - totalCost;
    const marginPercent = contractPrice > 0 ? (profit / contractPrice) * 100 : 0;
    const profitPerHour = (job.actual_labor_hours || 0) > 0 ? profit / job.actual_labor_hours : 0;
    const targetProfitPerHour = job.target_profit_per_hour || 50;
    const profitHealthScore = Math.min(100, Math.max(0, (marginPercent * 0.5) + ((profitPerHour / targetProfitPerHour) * 50)));

    // ---- Category variance (estimate vs actual) ----
    const [timeEntries, crewCosts, expenses, changeOrders] = await Promise.all([
      b.entities.TimeEntry.filter({ job_id: jobId }),
      b.entities.CrewCost.filter({ job_id: jobId }),
      b.entities.JobExpense.filter({ job_id: jobId }),
      b.entities.ChangeOrder.filter({ job_id: jobId }),
    ]);

    const sum = (arr, sel) => (arr || []).reduce((s, x) => s + (Number(sel(x)) || 0), 0);
    const burdened = (h, w) => (Number(h) || 0) * (Number(w) || 0) * (1 + burdenPercent / 100);

    const employeeCrews = (crewCosts || []).filter((c) => c.worker_type === 'Employee');
    const laborActual = sum(timeEntries, (e) => burdened(e.hours, e.labor_rate))
      + sum(employeeCrews, (c) => burdened(c.hours_worked, c.hourly_rate))
      + sum((expenses || []).filter((x) => x.category === 'labor'), (x) => x.amount);
    const materialsActual = sum((expenses || []).filter((x) => x.category === 'materials'), (x) => x.amount);
    const subcontractorActual = sum((crewCosts || []).filter((c) => c.worker_type === 'Subcontractor'), (c) => c.total_cost || c.quoted_amount || 0)
      + sum((expenses || []).filter((x) => x.category === 'subcontractor'), (x) => x.amount);
    const equipmentActual = sum((expenses || []).filter((x) => x.category === 'equipment_other'), (x) => x.amount);

    const laborEst = job.estimated_labor_cost != null ? Number(job.estimated_labor_cost) || 0
      : (Number(job.estimated_labor_hours) || 0) * (Number(job.labor_rate) || 0);
    const materialsEst = Number(job.estimated_material_cost) || 0;
    const subcontractorEst = Number(job.estimated_subcontractor_cost) || 0;
    const equipmentEst = Number(job.estimated_equipment_cost) || 0;

    const cats = [
      { key: 'labor', label: 'Labor', est: laborEst, act: laborActual },
      { key: 'materials', label: 'Materials', est: materialsEst, act: materialsActual },
      { key: 'subcontractor', label: 'Subcontractor', est: subcontractorEst, act: subcontractorActual },
      { key: 'equipment_other', label: 'Equipment/Other', est: equipmentEst, act: equipmentActual },
    ];

    // Labor % complete as job-progress proxy
    const estHours = Number(job.estimated_labor_hours) || 0;
    const actualHours = sum(timeEntries, (e) => e.hours) + sum(employeeCrews, (c) => c.hours_worked);
    const jobPctComplete = estHours > 0 && actualHours > 0 ? Math.min(actualHours / estHours, 1) : null;
    const projectFactor = jobPctComplete != null && jobPctComplete > 0 && jobPctComplete < 1 ? 1 / jobPctComplete : 1;

    const approvedCORevenue = sum((changeOrders || []).filter((co) => co.status === 'approved'), (co) => co.final_price_to_client || co.sell_price || 0);
    const adjustedRevenue = contractPrice + approvedCORevenue;

    const totalActual = laborActual + materialsActual + subcontractorActual + equipmentActual;
    const projectedTotalCost = cats.reduce((s, c) => s + (c.est > 0 ? c.act * projectFactor : c.act), 0);
    const currentMargin = adjustedRevenue > 0 ? ((adjustedRevenue - totalActual) / adjustedRevenue) * 100 : 0;
    const projectedMargin = adjustedRevenue > 0 ? ((adjustedRevenue - projectedTotalCost) / adjustedRevenue) * 100 : 0;

    const varianceAlerts = [];
    for (const c of cats) {
      if (c.est > 0 && c.act > c.est * (1 + threshold / 100)) {
        const overPct = ((c.act - c.est) / c.est) * 100;
        varianceAlerts.push(`${c.label} tracking ${Math.round(overPct)}% over estimate`);
      }
    }

    // ---- Existing leakage alerts (now with burdened labor) ----
    const alerts = [];
    if (marginPercent < 15) alerts.push('Low margin job');
    if (job.estimated_labor_hours && job.actual_labor_hours > job.estimated_labor_hours * 1.15) {
      alerts.push('Labor hours exceeding estimate');
    }
    if (job.estimated_material_cost && job.material_cost > job.estimated_material_cost * 1.20) {
      alerts.push('Material cost overrun');
    }
    if (projectedMargin < (job.target_margin_percent || 15)) {
      alerts.push('Projected margin below target');
    }
    for (const va of varianceAlerts) {
      if (!alerts.includes(va)) alerts.push(va);
    }

    await b.entities.Job.update(jobId, {
      profit_alerts: alerts.join(', ') || null,
      true_margin_percent: Math.round(marginPercent * 100) / 100,
    });

    return Response.json({
      success: true,
      labor_cost: laborCost,
      labor_cost_raw: laborCostRaw,
      burden_percent: burdenPercent,
      total_cost: totalCost,
      profit,
      margin_percent: marginPercent,
      profit_per_hour: profitPerHour,
      profit_health_score: profitHealthScore,
      projected_total_cost: projectedTotalCost,
      projected_profit: adjustedRevenue - projectedTotalCost,
      projected_margin: projectedMargin,
      current_margin: currentMargin,
      alerts,
      variance: {
        categories: cats.map((c) => ({
          ...c,
          overPct: c.est > 0 ? ((c.act - c.est) / c.est) * 100 : 0,
          isOver: c.est > 0 && c.act > c.est * (1 + threshold / 100),
          projected: c.est > 0 ? c.act * projectFactor : c.act,
        })),
        threshold,
        job_pct_complete: jobPctComplete,
        adjusted_revenue: adjustedRevenue,
        total_actual: totalActual,
      },
    });
  } catch (error) {
    console.error('checkProfitLeakage error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});