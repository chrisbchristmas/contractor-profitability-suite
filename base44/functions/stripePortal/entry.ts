import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    // Read body BEFORE createClientFromRequest to avoid body-consumption issues
    const { returnUrl, session_token } = await req.json().catch(() => ({}));

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

    if (!customer.stripe_customer_id) {
      return Response.json({ error: 'No Stripe customer found' }, { status: 400 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: returnUrl || `${req.headers.get('origin') || 'https://app.base44.com'}/Billing`,
    });

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});