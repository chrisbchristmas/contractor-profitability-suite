// NOTE: Requires STRIPE_SECRET_KEY as a Supabase Edge Function secret — manual config.
import { entities } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { returnUrl, session_token } = await req.json().catch(() => ({}));

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

    if (!customer.stripe_customer_id) {
      return Response.json({ error: 'No Stripe customer found' }, { status: 400, headers: corsHeaders });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: returnUrl || `${req.headers.get('origin') || 'https://contractorprofitabilitysuite.com'}/Billing`,
    });

    return Response.json({ url: session.url }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
