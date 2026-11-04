import { entities } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    let token;
    try {
      const body = await req.json();
      token = body?.token;
    } catch (_e) {
      token = null;
    }
    if (!token) {
      token = new URL(req.url).searchParams.get('token');
    }

    if (!token || typeof token !== 'string' || token.startsWith('$')) {
      return Response.json({ error: 'Invalid token' }, { status: 400, headers: corsHeaders });
    }

    const cos = await entities.ChangeOrder.filter({ approval_token: token });
    const co = cos?.[0];
    if (!co) return Response.json({ error: 'Change order not found' }, { status: 404, headers: corsHeaders });

    let viewedStatus = co.status;
    if (co.status === 'sent') {
      const now = new Date().toISOString();
      try {
        await entities.ChangeOrder.update(co.id, {
          status: 'viewed',
          viewed_at: now,
        });
        viewedStatus = 'viewed';
      } catch (_e) { /* non-fatal */ }
    }

    let job_name = null;
    let client_name = null;
    if (co.job_id) {
      const jobs = await entities.Job.filter({ id: co.job_id });
      const job = jobs?.[0];
      job_name = job?.job_name;
      client_name = job?.client_name;
    }

    return Response.json({
      description: co.description,
      status: viewedStatus,
      signer_name: co.signer_name || null,
      signed_at: co.signed_at || null,
      viewed_at: co.viewed_at || null,
      declined_at: co.declined_at || null,
      decline_reason: co.decline_reason || null,
      job_name,
      client_name,
      payment_due_days: co.payment_due_days || null,
      photos: Array.isArray(co.photos) ? co.photos : [],
      breakdown: {
        labor: co.true_labor_cost || 0,
        materials: co.material_cost || 0,
        equipment: co.equipment_cost || 0,
        subcontractor: co.subcontractor_cost || 0,
        subtotal: co.subtotal_before_overhead || 0,
        overhead: co.overhead_amount || 0,
        tax: co.tax_amount || 0,
        total: co.final_price_to_client || co.sell_price || 0,
      },
    }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
