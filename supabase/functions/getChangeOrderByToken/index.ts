import { entities, supa } from '../_shared/base44compat.ts';
import { hasPro } from '../_shared/owner.ts';
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

    // Deposit offer mirrors payInvoice's ?co= gating so the button only shows when checkout will work.
    let deposit = null;
    const { data: owner } = await supa.from('customer').select('co_deposit_percent,stripe_connect_account_id,connect_charges_enabled,subscription_status,subscription_plan,trial_ends_at')
      .ilike('email', (co.created_by || '').replace(/[%_\\]/g, '\\$&')).maybeSingle();
    const pct = Math.min(100, Math.max(0, Number(owner?.co_deposit_percent) || 0));
    const amount = Math.round((Number(co.final_price_to_client || co.sell_price) || 0) * pct) / 100;
    if (co.deposit_paid_at) {
      deposit = { percent: pct, amount: co.deposit_amount ?? amount, paid: true, pay_url: null };
    } else if (pct > 0 && amount >= 0.5 && owner?.stripe_connect_account_id && owner.connect_charges_enabled && hasPro(owner)) {
      deposit = { percent: pct, amount, paid: false, pay_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payInvoice?co=${token}` };
    }

    return Response.json({
      deposit,
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
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500, headers: corsHeaders });
  }
});
