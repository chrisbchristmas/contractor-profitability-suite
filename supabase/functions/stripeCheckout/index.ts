// NOTE: Requires STRIPE_SECRET_KEY, STRIPE_SOLO_PRICE_ID, STRIPE_PRO_PRICE_ID as
// Supabase Edge Function secrets — manual configuration, not auto-filled.
import { entities } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { sessionFresh } from '../_shared/security.ts';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

const PLANS = {
  solo: {
    priceId: Deno.env.get('STRIPE_SOLO_PRICE_ID'),
    name: 'Solo',
    trialDays: 14,
  },
  pro: {
    priceId: Deno.env.get('STRIPE_PRO_PRICE_ID'),
    name: 'Pro',
    trialDays: 14,
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { plan, session_token } = await req.json();

    if (!session_token) {
      return Response.json({ error: 'Authentication required' }, { status: 401, headers: corsHeaders });
    }

    const customers = await entities.Customer.filter({ session_token });
    if (!customers || customers.length === 0) {
      return Response.json({ error: 'Authentication required' }, { status: 401, headers: corsHeaders });
    }
    const customer = customers[0];
    if (customer.session_token !== session_token || !sessionFresh(session_token)) {
      return Response.json({ error: 'Authentication required' }, { status: 401, headers: corsHeaders });
    }

    const selectedPlan = typeof plan === 'string' && Object.hasOwn(PLANS, plan) ? PLANS[plan] : null;
    if (!selectedPlan) {
      return Response.json({ error: 'Invalid plan' }, { status: 400, headers: corsHeaders });
    }

    if (customer.subscription_status === 'active') {
      return Response.json({ error: 'You already have an active subscription. Manage it from Billing.' }, { status: 409, headers: corsHeaders });
    }
    // Honour the in-app trial: only grant the REMAINING trial days (no stacked 28-day trial).
    let trialDays = 0;
    if (customer.trial_ends_at) {
      const ms = new Date(customer.trial_ends_at).getTime() - Date.now();
      if (ms > 0) trialDays = Math.min(selectedPlan.trialDays, Math.ceil(ms / 86400000));
    }
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: selectedPlan.priceId, quantity: 1 }],
      subscription_data: {
        ...(trialDays >= 1 ? { trial_period_days: trialDays } : {}),
        metadata: { user_id: customer.id, user_email: customer.email, plan },
      },
      ...(customer.stripe_customer_id ? { customer: customer.stripe_customer_id } : { customer_email: customer.email }),
      success_url: 'https://contractorprofitabilitysuite.com/dashboard?subscribed=true',
      cancel_url: 'https://contractorprofitabilitysuite.com/Billing',
      metadata: {
        user_id: customer.id,
        user_email: customer.email,
        plan,
      },
    });

    return Response.json({ url: session.url }, { headers: corsHeaders });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: 'Could not start checkout. Please try again.' }, { status: 500, headers: corsHeaders });
  }
});
