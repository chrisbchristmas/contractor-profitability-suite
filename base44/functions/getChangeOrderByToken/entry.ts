import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let token;
    try {
      const body = await req.json();
      token = body?.token;
    } catch (_e) {
      token = null;
    }
    // Also check query params as fallback
    if (!token) {
      token = new URL(req.url).searchParams.get('token');
    }

    // NoSQL injection prevention: reject non-string or $-prefixed values
    if (!token || typeof token !== 'string' || token.startsWith('$')) {
      return Response.json({ error: 'Invalid token' }, { status: 400 });
    }

    // Public endpoint — use service role to look up by token (bypasses RLS)
    const cos = await base44.asServiceRole.entities.ChangeOrder.filter({ approval_token: token });
    const co = cos?.[0];
    if (!co) return Response.json({ error: 'Change order not found' }, { status: 404 });

    // Track first client view: transition sent -> viewed (audit trail)
    let viewedStatus = co.status;
    if (co.status === 'sent') {
      const now = new Date().toISOString();
      try {
        await base44.asServiceRole.entities.ChangeOrder.update(co.id, {
          status: 'viewed',
          viewed_at: now,
        });
        viewedStatus = 'viewed';
      } catch (_e) { /* non-fatal */ }
    }

    // Fetch job/project name
    let job_name = null;
    let client_name = null;
    if (co.job_id) {
      const jobs = await base44.asServiceRole.entities.Job.filter({ id: co.job_id });
      const job = jobs?.[0];
      job_name = job?.job_name;
      client_name = job?.client_name;
    }

    // Return ONLY client-safe fields — no internal margin/profit data
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
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});