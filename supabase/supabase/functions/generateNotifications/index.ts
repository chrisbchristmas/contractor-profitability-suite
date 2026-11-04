import { entities, authMe } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));

    const automationSecret = Deno.env.get('AUTOMATION_SECRET_KEY');
    const isAutomationCall = typeof automationSecret === 'string' && automationSecret !== '' && body?.automation_secret === automationSecret;
    if (!isAutomationCall) {
      const user = await authMe(req);
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders });
    }

    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const todayStr = now.toISOString().split('T')[0];
    let created = 0;

    const allJobs = await entities.Job.filter({});
    const jobMap = new Map(allJobs.map((j) => [j.id, j]));

    const hasUnread = async (userId, type, jobId) => {
      const existing = await entities.Notification.filter({ user_id: userId, type, job_id: jobId, is_read: false });
      return existing.length > 0;
    };

    for (const job of allJobs) {
      const targetMargin = job.target_margin_percent ?? 0;
      if (targetMargin <= 0) continue;
      const contractValue = job.contract_value || job.contract_price || 0;
      if (contractValue <= 0) continue;
      const laborCost = (job.actual_labor_hours || 0) * (job.labor_rate || 0);
      const totalCost = laborCost + (job.material_cost || 0) + (job.subcontractor_cost || 0) + (job.overhead_cost || 0);
      const profit = contractValue - totalCost;
      const marginPercent = contractValue > 0 ? (profit / contractValue) * 100 : 0;

      if (marginPercent < targetMargin - 5) {
        const userId = job.user_id || job.assigned_user_id || job.created_by_id;
        if (!userId) continue;
        if (await hasUnread(userId, 'margin_alert', job.id)) continue;
        await entities.Notification.create({
          user_id: userId,
          type: 'margin_alert',
          message: `Job "${job.job_name}" margin (${marginPercent.toFixed(1)}%) is more than 5% below target (${targetMargin}%).`,
          job_id: job.id,
          is_read: false,
        });
        created++;
      }
    }

    const sentCOs = await entities.ChangeOrder.filter({ status: 'sent' });
    for (const co of sentCOs) {
      const coDate = co.created_date ? new Date(co.created_date) : null;
      if (!coDate || coDate > fortyEightHoursAgo) continue;
      const job = jobMap.get(co.job_id);
      if (!job) continue;
      const userId = job.user_id || job.assigned_user_id || job.created_by_id;
      if (!userId) continue;
      if (await hasUnread(userId, 'co_pending', job.id)) continue;
      const desc = (co.description || '').slice(0, 60);
      await entities.Notification.create({
        user_id: userId,
        type: 'co_pending',
        message: `Change order "${desc}" has been pending approval for over 48 hours.`,
        job_id: job.id,
        is_read: false,
      });
      created++;
    }

    const invoices = await entities.Invoice.filter({});
    for (const inv of invoices) {
      if (inv.status === 'paid') continue;
      if (!inv.due_date || inv.due_date >= todayStr) continue;
      const jobId = inv.job_id;
      const job = jobId ? jobMap.get(jobId) : null;
      const userId = job ? (job.user_id || job.assigned_user_id || job.created_by_id) : null;
      if (!userId) continue;
      if (await hasUnread(userId, 'invoice_overdue', jobId)) continue;
      const invLabel = inv.invoice_number ? `Invoice ${inv.invoice_number}` : 'An invoice';
      const jobLabel = inv.job_name || (job ? job.job_name : '');
      await entities.Notification.create({
        user_id: userId,
        type: 'invoice_overdue',
        message: `${invLabel}${jobLabel ? ` for ${jobLabel}` : ''} is overdue (due ${inv.due_date}).`,
        job_id: jobId,
        is_read: false,
      });
      created++;
    }

    return Response.json({ success: true, notificationsCreated: created }, { headers: corsHeaders });
  } catch (error) {
    console.error('generateNotifications error:', error.message);
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
