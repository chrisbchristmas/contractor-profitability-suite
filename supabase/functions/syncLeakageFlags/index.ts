import { entities, authMe } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const user = await authMe(req);
    if (!user) {
      return Response.json({ error: 'Unauthorized: user authentication required' }, { status: 401, headers: corsHeaders });
    }

    const { change_order_id, flags } = await req.json();

    if (typeof change_order_id !== 'string' || change_order_id.startsWith('$')) {
      return Response.json({ error: 'Invalid change_order_id' }, { status: 400, headers: corsHeaders });
    }
    if (!change_order_id) return Response.json({ error: 'change_order_id required' }, { status: 400, headers: corsHeaders });

    const cos = await entities.ChangeOrder.filter({ id: change_order_id });
    const co = cos[0];
    if (!co) return Response.json({ error: 'Change order not found' }, { status: 404, headers: corsHeaders });

    const jobs = await entities.Job.filter({ id: co.job_id });
    const job = jobs[0];
    if (!job) return Response.json({ error: 'Parent job not found' }, { status: 404, headers: corsHeaders });

    const isJobOwner = job.user_id === user.id || job.assigned_user_id === user.id || job.created_by_id === user.id;
    if (user.role !== 'admin' && !isJobOwner) {
      return Response.json({ error: 'Forbidden: you do not have access to this change order' }, { status: 403, headers: corsHeaders });
    }

    const existing = await entities.LeakageFlag.filter({ change_order_id });
    for (const f of existing) {
      await entities.LeakageFlag.delete(f.id);
    }

    if (flags && Array.isArray(flags) && flags.length > 0) {
      for (const flag of flags) {
        const ft = typeof flag?.flag_type === 'string' ? flag.flag_type : '';
        const fm = typeof flag?.flag_message === 'string' ? flag.flag_message : '';
        if (ft.startsWith('$') || fm.startsWith('$')) continue;
        await entities.LeakageFlag.create({
          change_order_id,
          flag_type: ft,
          flag_message: fm,
        });
      }
    }

    return Response.json({ success: true, flagsCreated: flags?.length || 0 }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
