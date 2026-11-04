// NOTE: Requires STRIPE_SECRET_KEY, STRIPE_SOLO_PRICE_ID, STRIPE_PRO_PRICE_ID as
// Supabase Edge Function secrets — manual configuration, not auto-filled.
import { entities } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';
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
    if (customer.session_token !== session_token) {
      return Response.json({ error: 'Authentication required' }, { status: 401, headers: corsHeaders });
    }

    const selectedPlan = PLANS[plan];
    if (!selectedPlan) {
      return Response.json({ error: 'Invalid plan' }, { status: 400, headers: corsHeaders });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: selectedPlan.priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: selectedPlan.trialDays,
        metadata: { user_id: customer.id, user_email: customer.email, plan },
      },
      customer_email: customer.email,
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
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
