import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized: user authentication required' }, { status: 401 });
    }

    const b = base44.asServiceRole;

    const { change_order_id, flags } = await req.json();

    // NoSQL injection prevention: reject non-string or $-prefixed values
    if (typeof change_order_id !== 'string' || change_order_id.startsWith('$')) {
      return Response.json({ error: 'Invalid change_order_id' }, { status: 400 });
    }
    if (!change_order_id) return Response.json({ error: 'change_order_id required' }, { status: 400 });

    // Verify caller owns the parent job for this change order
    const cos = await b.entities.ChangeOrder.filter({ id: change_order_id });
    const co = cos[0];
    if (!co) return Response.json({ error: 'Change order not found' }, { status: 404 });

    const jobs = await b.entities.Job.filter({ id: co.job_id });
    const job = jobs[0];
    if (!job) return Response.json({ error: 'Parent job not found' }, { status: 404 });

    const isJobOwner = job.user_id === user.id || job.assigned_user_id === user.id || job.created_by_id === user.id;
    if (user.role !== 'admin' && !isJobOwner) {
      return Response.json({ error: 'Forbidden: you do not have access to this change order' }, { status: 403 });
    }

    // Delete old flags for this CO
    const existing = await b.entities.LeakageFlag.filter({ change_order_id });
    for (const f of existing) {
      await b.entities.LeakageFlag.delete(f.id);
    }

    // Create new flags
    if (flags && Array.isArray(flags) && flags.length > 0) {
      for (const flag of flags) {
        const ft = typeof flag?.flag_type === 'string' ? flag.flag_type : '';
        const fm = typeof flag?.flag_message === 'string' ? flag.flag_message : '';
        if (ft.startsWith('$') || fm.startsWith('$')) continue;
        await b.entities.LeakageFlag.create({
          change_order_id,
          flag_type: ft,
          flag_message: fm,
        });
      }
    }

    return Response.json({ success: true, flagsCreated: flags?.length || 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});