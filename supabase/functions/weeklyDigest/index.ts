// Monday-morning profit digest. Invoked by pg_cron with header x-cron-secret = CRON_SECRET.
// For every customer with weekly_digest=true and active access, emails: jobs over budget,
// unpaid/overdue invoices, pending change orders, and last week's logged costs.
import { supa, sendEmail } from '../_shared/base44compat.ts';
import { hasAccess } from '../_shared/security.ts';
import { SITE } from '../_shared/owner.ts';

const $ = (n: number) => '$' + Math.round(n || 0).toLocaleString('en-US');
const esc = (s: string) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

async function rows(table: string, email: string, extra = (q: any) => q) {
  const { data, error } = await extra(supa.from(table).select('*').eq('created_by', email));
  if (error) { console.error(table, error.message); return []; }
  return data || [];
}

async function digestFor(c: any) {
  const email = c.email;
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const [jobs, expenses, invoices, cos] = await Promise.all([
    rows('job', email, (q) => q.neq('status', 'completed')),
    rows('job_expense', email),
    rows('invoice', email, (q) => q.neq('payment_status', 'paid')),
    rows('change_order', email, (q) => q.in('status', ['sent', 'viewed'])),
  ]);
  const spentByJob: Record<string, number> = {};
  let weekSpend = 0;
  for (const e of expenses) {
    spentByJob[e.job_id] = (spentByJob[e.job_id] || 0) + Number(e.amount || 0);
    if ((e.date || '') >= weekAgo) weekSpend += Number(e.amount || 0);
  }
  const threshold = Number(c.variance_alert_threshold_percent ?? 8);
  const overBudget = jobs
    .map((j: any) => ({ j, spent: spentByJob[j.id] || 0, est: Number(j.estimated_cost || 0) }))
    .filter((x: any) => x.est > 0 && x.spent > x.est * (1 + threshold / 100))
    .sort((a: any, b: any) => (b.spent - b.est) - (a.spent - a.est));
  const sentInvoices = invoices.filter((i: any) => i.status !== 'draft');
  const overdue = sentInvoices.filter((i: any) => i.due_date && i.due_date < today);
  const outstanding = sentInvoices.reduce((s: number, i: any) => s + Number(i.total_amount || 0) - Number(i.payment_amount || 0), 0);
  const pendingCO = cos.reduce((s: number, co: any) => s + Number(co.final_price_to_client ?? co.sell_price ?? 0), 0);
  const jobName: Record<string, string> = Object.fromEntries(jobs.map((j: any) => [j.id, j.job_name]));

  if (!jobs.length && !sentInvoices.length && !cos.length) return null; // nothing worth emailing

  const li = (s: string) => `<li style="margin:4px 0">${s}</li>`;
  const section = (title: string, items: string[], empty: string) =>
    `<h3 style="margin:20px 0 6px;font-size:15px;color:#0f172a">${title}</h3>` +
    (items.length ? `<ul style="padding-left:18px;margin:0;color:#334155">${items.join('')}</ul>` : `<p style="margin:0;color:#64748b">${empty}</p>`);

  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0f172a">
  <h2 style="margin:0 0 4px">Your week in profit</h2>
  <p style="margin:0 0 16px;color:#64748b">${esc(c.company_name || '')} &middot; ${jobs.length} active job${jobs.length === 1 ? '' : 's'}</p>
  <table style="width:100%;border-collapse:collapse;text-align:center"><tr>
    <td style="padding:10px;background:#f1f5f9;border-radius:8px"><div style="font-size:20px;font-weight:bold">${$(weekSpend)}</div><div style="font-size:12px;color:#64748b">costs logged (7d)</div></td>
    <td style="width:8px"></td>
    <td style="padding:10px;background:#f1f5f9;border-radius:8px"><div style="font-size:20px;font-weight:bold">${$(outstanding)}</div><div style="font-size:12px;color:#64748b">unpaid invoices</div></td>
    <td style="width:8px"></td>
    <td style="padding:10px;background:#f1f5f9;border-radius:8px"><div style="font-size:20px;font-weight:bold">${$(pendingCO)}</div><div style="font-size:12px;color:#64748b">change orders awaiting approval</div></td>
  </tr></table>
  ${section('Jobs over budget', overBudget.slice(0, 8).map((x: any) => li(`<b>${esc(x.j.job_name)}</b>: ${$(x.spent)} spent vs ${$(x.est)} estimated (<span style="color:#dc2626">+${$(x.spent - x.est)}</span>)`)), 'No jobs over budget. Nice.')}
  ${section('Overdue invoices', overdue.slice(0, 8).map((i: any) => li(`<b>${esc(i.invoice_number || i.job_name || 'Invoice')}</b> &middot; ${esc(i.client_name || '')}: ${$(Number(i.total_amount || 0) - Number(i.payment_amount || 0))} (due ${esc(i.due_date)})`)), 'Nothing overdue.')}
  ${section('Change orders awaiting signature', cos.slice(0, 8).map((co: any) => li(`<b>${esc((co.description || 'Change order').slice(0, 60))}</b>${jobName[co.job_id] ? ' &middot; ' + esc(jobName[co.job_id]) : ''}: ${$(Number(co.final_price_to_client ?? co.sell_price ?? 0))}`)), 'None pending.')}
  <p style="margin:24px 0"><a href="${SITE}/Dashboard" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Open dashboard</a></p>
  <p style="font-size:12px;color:#94a3b8">You get this every Monday. Turn it off in Settings &rarr; Notifications.</p></div>`;
  return { html, subject: overBudget.length ? `${overBudget.length} job${overBudget.length === 1 ? '' : 's'} over budget this week` : 'Your weekly profit digest' };
}

Deno.serve(async (req) => {
  const secret = Deno.env.get('CRON_SECRET');
  if (!secret || req.headers.get('x-cron-secret') !== secret) return new Response('Forbidden', { status: 403 });
  const { data: customers, error } = await supa.from('customer').select('*').eq('weekly_digest', true);
  if (error) return new Response(error.message, { status: 500 });
  let sent = 0;
  for (const c of customers || []) {
    if (!c.email || !hasAccess(c)) continue;
    try {
      const d = await digestFor(c);
      if (!d) continue;
      await sendEmail({ to: c.email, subject: d.subject, body: d.html });
      sent++;
    } catch (e) { console.error('digest failed for', c.id, e); }
  }
  return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } });
});
