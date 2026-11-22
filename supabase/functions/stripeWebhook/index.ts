// Requires STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_SOLO_PRICE_ID, STRIPE_PRO_PRICE_ID as secrets.
import { entities, supa } from '../_shared/base44compat.ts';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const PLAN_BY_PRICE = {
  [Deno.env.get('STRIPE_SOLO_PRICE_ID')]: 'solo',
  [Deno.env.get('STRIPE_PRO_PRICE_ID')]: 'pro',
};

// The Stripe account is shared with other products (e.g. CollectrBrief): only act on CPS subscriptions.
const cpsPlan = (sub) => sub?.items?.data?.map((i) => PLAN_BY_PRICE[i.price?.id]).find(Boolean);

async function findCustomer({ userId, stripeCustomerId, email }) {
  // Legacy Base44 subs carry non-UUID user_ids; querying the uuid column with them throws.
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId || '')) { const r = await entities.Customer.filter({ id: userId }); if (r[0]) return r[0]; }
  if (stripeCustomerId) { const r = await entities.Customer.filter({ stripe_customer_id: stripeCustomerId }); if (r[0]) return r[0]; }
  if (email) { const r = await entities.Customer.filter({ email: email.toLowerCase().trim() }); if (r[0]) return r[0]; }
  return null;
}

async function apply(target, fields) {
  const customer = await findCustomer(target);
  if (!customer) { console.warn('[stripeWebhook] no matching customer', target); return; }
  await entities.Customer.update(customer.id, fields);
  // Mirror onto app_user (keyed by created_by = email; app_user has no email column). Best-effort only.
  try {
    const users = await entities.User.filter({ created_by: customer.email });
    if (users[0]) await entities.User.update(users[0].id, fields);
  } catch (e) { console.warn('[stripeWebhook] app_user mirror skipped:', e.message); }
  console.log(`[stripeWebhook] ${customer.email} ->`, fields);
}

// Contractor invoice / change-order payments arrive from Connect (event.account set), signed with a separate secret.
async function recordConnectPayment(event) {
  const s = event.data.object;
  if (s.payment_status !== 'paid') return;
  const amount = (s.amount_total || 0) / 100;
  const invId = s.metadata?.invoice_id, coId = s.metadata?.change_order_id;
  const table = invId ? 'invoice' : coId ? 'change_order' : null;
  const id = invId || coId;
  if (!table || !/^[0-9a-f-]{36}$/i.test(id)) return;
  const { data: rec } = await supa.from(table).select('*').eq('id', id).maybeSingle();
  if (!rec) return;
  // The paying account must be the connected account of the record's owner, so one account can't mark another's invoice paid.
  const { data: owner } = await supa.from('customer').select('stripe_connect_account_id')
    .ilike('email', (rec.created_by || '').replace(/[%_\\]/g, '\\$&')).maybeSingle();
  if (!owner?.stripe_connect_account_id || owner.stripe_connect_account_id !== event.account) return;
  const today = new Date().toISOString().split('T')[0];
  if (table === 'invoice') {
    if (rec.status === 'paid') return;
    await supa.from('invoice').update({ status: 'paid', payment_status: 'paid', paid_date: today, payment_received_date: today,
      payment_amount: amount, stripe_session_id: s.id }).eq('id', id);
  } else {
    if (rec.deposit_paid_at) return;
    await supa.from('change_order').update({ deposit_paid_at: new Date().toISOString(), deposit_amount: amount, deposit_session_id: s.id }).eq('id', id);
  }
  console.log(`[stripeWebhook] connect payment recorded on ${table} ${id}`);
}

Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature');
  const platformSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const connectSecret = Deno.env.get('STRIPE_CONNECT_WEBHOOK_SECRET');
  if (!sig || !platformSecret) return new Response('Webhook Error', { status: 400 });
  const body = await req.text();

  let event, isConnect = false;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, platformSecret);
  } catch (err) {
    try {
      if (!connectSecret) throw err;
      event = await stripe.webhooks.constructEventAsync(body, sig, connectSecret);
      isConnect = true;
    } catch (err2) {
      console.error('Webhook signature verification failed:', err2.message);
      return new Response('Webhook Error', { status: 400 });
    }
  }

  // Replay / duplicate protection: the first delivery claims the event id; failures release it so Stripe's retry works.
  const { error: dupe } = await supa.from('stripe_event').insert({ id: event.id });
  if (dupe) {
    if (dupe.code === '23505') return Response.json({ received: true, duplicate: true });
    console.warn('[stripeWebhook] dedupe insert failed, processing anyway:', dupe.message);
  }

  try {
    if (isConnect) {
      if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') await recordConnectPayment(event);
      return Response.json({ received: true });
    }
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object;
      const plan = s.metadata?.plan;
      if (s.mode === 'subscription' && (plan === 'solo' || plan === 'pro')) {
        await apply(
          { userId: s.metadata?.user_id, email: s.metadata?.user_email || s.customer_details?.email || s.customer_email },
          { subscription_status: 'active', subscription_plan: plan, stripe_customer_id: s.customer },
        );
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const plan = cpsPlan(sub);
      if (plan) {
        const deleted = event.type === 'customer.subscription.deleted';
        const status = deleted ? 'canceled' : (sub.status === 'active' || sub.status === 'trialing' ? 'active' : sub.status);
        const sc = await stripe.customers.retrieve(sub.customer);
        await apply(
          { userId: sub.metadata?.user_id, stripeCustomerId: sub.customer, email: sc?.email },
          deleted ? { subscription_status: status } : { subscription_status: status, subscription_plan: plan },
        );
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err.message);
    await supa.from('stripe_event').delete().eq('id', event.id);
    // Non-2xx so Stripe retries instead of silently dropping a paid customer's activation.
    return new Response('Processing error', { status: 500 });
  }

  return Response.json({ received: true });
});
