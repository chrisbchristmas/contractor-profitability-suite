// Public pay link: GET ?t=<invoice pay_token>, or ?co=<change order approval_token> for the signed-CO deposit
// (co_deposit_percent of the CO price). -> Stripe Checkout on the contractor's connected account.
// Stripe returns to the same URL + &session_id=.. where we confirm payment and record it.
// shortcut: payment is recorded on the return redirect, not a Connect webhook; if a payer closes the tab before
// the redirect the record stays unpaid (money still lands in the contractor's Stripe). Add a Connect webhook if that shows up.
import Stripe from 'npm:stripe@14.21.0';
import { supa } from '../_shared/base44compat.ts';
import { SITE, hasPro } from '../_shared/owner.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const go = (url: string) => new Response(null, { status: 303, headers: { Location: url } });
const done = (status: string) => go(`${SITE}/invoice-paid?status=${status}`);
const UUID = /^[0-9a-f-]{36}$/i;

Deno.serve(async (req) => {
  try {
    const u = new URL(req.url);
    const isCo = u.searchParams.has('co');
    const t = u.searchParams.get(isCo ? 'co' : 't') || '';
    if (!UUID.test(t)) return done('invalid');
    const { data: rec } = isCo
      ? await supa.from('change_order').select('*').eq('approval_token', t).maybeSingle()
      : await supa.from('invoice').select('*').eq('pay_token', t).maybeSingle();
    if (!rec) return done('invalid');
    if (isCo ? rec.deposit_paid_at : rec.status === 'paid') return done('paid');
    if (isCo && rec.status !== 'approved') return done('invalid');

    const { data: owner } = await supa.from('customer').select('id,company_name,stripe_connect_account_id,connect_charges_enabled,co_deposit_percent,subscription_status,subscription_plan,trial_ends_at')
      .ilike('email', (rec.created_by || '').replace(/[%_\\]/g, '\\$&')).maybeSingle();
    const acct = owner?.stripe_connect_account_id;
    if (!acct || !owner.connect_charges_enabled) return done('unavailable');

    const sessionId = u.searchParams.get('session_id');
    if (sessionId) {
      const s = await stripe.checkout.sessions.retrieve(sessionId, { stripeAccount: acct });
      const paidFor = isCo ? s.metadata?.change_order_id : s.metadata?.invoice_id;
      if (s.payment_status === 'paid' && paidFor === rec.id) {
        const amount = (s.amount_total || 0) / 100;
        if (isCo) {
          await supa.from('change_order').update({
            deposit_paid_at: new Date().toISOString(), deposit_amount: amount, deposit_session_id: s.id,
          }).eq('id', rec.id);
        } else {
          const today = new Date().toISOString().split('T')[0];
          await supa.from('invoice').update({
            status: 'paid', payment_status: 'paid', paid_date: today, payment_received_date: today,
            payment_amount: amount, stripe_session_id: s.id,
          }).eq('id', rec.id);
        }
        return done('paid');
      }
      return done('pending');
    }

    // Pro feature: confirming an already-paid session above still works if the plan lapsed.
    if (!hasPro(owner)) return done('unavailable');
    const pct = Math.min(100, Math.max(0, Number(owner.co_deposit_percent) || 0));
    const dollars = isCo
      ? (Number(rec.final_price_to_client || rec.sell_price) || 0) * pct / 100
      : Number(rec.total_amount) || 0;
    const cents = Math.round(dollars * 100);
    if (cents < 50) return done(isCo ? 'unavailable' : 'invalid');
    const label = isCo
      ? `${pct}% deposit - Change order: ${String(rec.description || '').slice(0, 80)}`
      : `${rec.invoice_number || `Invoice ${rec.id.slice(-6).toUpperCase()}`}${rec.job_name ? ' - ' + rec.job_name : ''}`;
    const self = `${Deno.env.get('SUPABASE_URL')}/functions/v1/payInvoice?${isCo ? 'co' : 't'}=${t}`;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ quantity: 1, price_data: { currency: 'usd', unit_amount: cents,
        product_data: { name: label, description: owner.company_name || undefined } } }],
      metadata: isCo ? { change_order_id: rec.id } : { invoice_id: rec.id },
      success_url: `${self}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE}/invoice-paid?status=cancelled`,
    }, { stripeAccount: acct });
    return go(session.url!);
  } catch (e) {
    console.error('payInvoice', e);
    return done('error');
  }
});
