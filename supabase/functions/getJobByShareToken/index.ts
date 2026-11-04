import { entities } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const token = body?.token;

    if (!token || typeof token !== 'string') {
      return Response.json({ error: 'Token required' }, { status: 400, headers: corsHeaders });
    }

    const jobs = await entities.Job.filter({ share_token: token });

    if (!jobs || jobs.length === 0) {
      return Response.json({ error: 'Job not found' }, { status: 404, headers: corsHeaders });
    }

    const job = jobs[0];

    const cos = await entities.ChangeOrder.filter({
      job_id: job.id,
      status: 'approved'
    });

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
    }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
