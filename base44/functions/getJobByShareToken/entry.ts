import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const token = body?.token;

    if (!token || typeof token !== 'string') {
      return Response.json({ error: 'Token required' }, { status: 400 });
    }

    const jobs = await base44.asServiceRole.entities.Job.filter({ share_token: token });

    if (!jobs || jobs.length === 0) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    const job = jobs[0];

    // Fetch approved change orders only — NEVER expose draft/sent COs or margin/profit fields
    const cos = await base44.asServiceRole.entities.ChangeOrder.filter({
      job_id: job.id,
      status: 'approved'
    }, '-created_date');

    const showContractValue = job.show_contract_value === true;
    const showCODetails = job.show_co_details === true;

    const safeCOs = cos.map(co => ({
      description: co.description,
      final_price_to_client: showCODetails ? (co.final_price_to_client || 0) : null,
    }));

    const coTotal = cos.reduce((s, co) => s + (co.final_price_to_client || 0), 0);

    return Response.json({
      job: {
        job_name: job.job_name,
        client_name: job.client_name || '',
        status: job.status,
        contract_value: showContractValue ? (job.contract_value || 0) : null,
        client_notes: job.client_notes || '',
        show_contract_value: showContractValue,
        show_co_details: showCODetails,
      },
      change_orders: safeCOs,
      total_with_cos: showContractValue ? ((job.contract_value || 0) + coTotal) : null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});