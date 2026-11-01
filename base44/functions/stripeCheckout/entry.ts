import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

const PLANS = {
  solo: {
    priceId: Deno.env.get("STRIPE_SOLO_PRICE_ID"),
    name: "Solo",
    trialDays: 14,
  },
  pro: {
    priceId: Deno.env.get("STRIPE_PRO_PRICE_ID"),
    name: "Pro",
    trialDays: 14,
  },
};

Deno.serve(async (req) => {
  try {
    // Read body BEFORE createClientFromRequest to avoid body-consumption issues
    const { plan, successUrl, cancelUrl, session_token } = await req.json();

    // Require Customer session token — no unauthenticated checkout
    if (!session_token) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);

    // Verify session token against Customer entity
    const customers = await base44.asServiceRole.entities.Customer.filter({ session_token });
    if (!customers || customers.length === 0) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }
    const customer = customers[0];
    if (customer.session_token !== session_token) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const selectedPlan = PLANS[plan];
    if (!selectedPlan) {
      return Response.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Use the authenticated Customer's email — never accept client-supplied email
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: selectedPlan.priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: selectedPlan.trialDays,
        metadata: { user_id: customer.id, user_email: customer.email, plan },
      },
      customer_email: customer.email,
      success_url: "https://contractorprofitabilitysuite.com/dashboard?subscribed=true",
      cancel_url: "https://contractorprofitabilitysuite.com/Billing",
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        user_id: customer.id,
        user_email: customer.email,
        plan,
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});