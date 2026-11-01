import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const [jobs, changeOrders] = await Promise.all([
      base44.entities.Job.list(),
      base44.entities.ChangeOrder.list(),
    ]);

    // Build Jobs CSV
    const jobHeaders = ['Job Name','Client','Contract Value','Estimated Cost','Target Margin %','Status','Start Date','Completion Date'];
    const jobRows = jobs.map(j => [
      j.job_name ?? '',
      j.client_name ?? '',
      j.contract_value ?? '',
      j.estimated_cost ?? '',
      j.target_margin_percent ?? '',
      j.status ?? '',
      j.start_date ?? '',
      j.completion_date ?? '',
    ]);

    // Build Change Orders CSV
    const coHeaders = ['Job ID','Description','Status','Labor Hours','Labor Rate','Material Cost','Subcontractor Cost','Equipment Cost','Markup %','Overhead %','Tax %','Sell Price','True Margin %'];
    const coRows = changeOrders.map(co => [
      co.job_id ?? '',
      co.description ?? '',
      co.status ?? '',
      co.labor_hours ?? '',
      co.labor_rate ?? '',
      co.material_cost ?? '',
      co.subcontractor_cost ?? '',
      co.equipment_cost ?? '',
      co.markup_percent ?? '',
      co.overhead_percent ?? '',
      co.tax_percent ?? '',
      co.sell_price ?? '',
      co.true_margin_percent ?? '',
    ]);

    const escape = (val) => `"${String(val).replace(/"/g, '""')}"`;
    const toCSV = (headers, rows) => [headers, ...rows].map(r => r.map(escape).join(',')).join('\n');

    const csv = `JOBS\n${toCSV(jobHeaders, jobRows)}\n\nCHANGE ORDERS\n${toCSV(coHeaders, coRows)}`;

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="jobs_export.csv"',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});