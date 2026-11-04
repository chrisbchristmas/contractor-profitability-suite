import { entities, authMe } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const user = await authMe(req);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

    const [jobs, changeOrders] = await Promise.all([
      entities.Job.list(),
      entities.ChangeOrder.list(),
    ]);

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
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="jobs_export.csv"',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
