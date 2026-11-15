// Requires STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_SOLO_PRICE_ID, STRIPE_PRO_PRICE_ID as secrets.
import { entities } from '../_shared/base44compat.ts';
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

Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!sig || !webhookSecret) return new Response('Webhook Error', { status: 400 });
  const body = await req.text();

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response('Webhook Error', { status: 400 });
  }

  try {
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
    // Non-2xx so Stripe retries instead of silently dropping a paid customer's activation.
    return new Response('Processing error', { status: 500 });
  }

  return Response.json({ received: true });
});
