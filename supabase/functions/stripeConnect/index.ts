// Stripe Connect (Standard accounts): the contractor's own Stripe account receives invoice payments.
// CPS takes no platform fee, so Standard accounts cost the platform nothing.
import Stripe from 'npm:stripe@14.21.0';
import { entities } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getOwner, hasPro, SITE } from '../_shared/owner.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const json = (b: unknown, status = 200) => Response.json(b, { status, headers: corsHeaders });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const owner = await getOwner(req, body.session_token);
    if (!owner) return json({ error: 'Unauthorized' }, 401);
    const c = owner.customer;

    if (body.action === 'status') {
      if (!c.stripe_connect_account_id) return json({ connected: false, charges_enabled: false });
      const acct = await stripe.accounts.retrieve(c.stripe_connect_account_id);
      if (acct.charges_enabled !== c.connect_charges_enabled) {
        await entities.Customer.update(c.id, { connect_charges_enabled: acct.charges_enabled });
      }
      return json({ connected: true, charges_enabled: acct.charges_enabled });
    }

    if (body.action === 'start') {
      if (!hasPro(c)) return json({ error: 'Online invoice payments are a Pro feature. Upgrade in Billing.' }, 403);
      let acctId = c.stripe_connect_account_id;
      if (!acctId) {
        const acct = await stripe.accounts.create({ type: 'standard', email: c.email, metadata: { cps_customer_id: c.id } });
        acctId = acct.id;
        await entities.Customer.update(c.id, { stripe_connect_account_id: acctId });
      }
      const link = await stripe.accountLinks.create({
        account: acctId, type: 'account_onboarding',
        refresh_url: `${SITE}/Settings?stripe=refresh`, return_url: `${SITE}/Settings?stripe=done`,
      });
      return json({ url: link.url });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
});
