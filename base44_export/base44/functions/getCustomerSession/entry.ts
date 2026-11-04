import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { session_token } = await req.json();

    if (!session_token || session_token.length < 32) {
      return Response.json({ error: 'No session token provided' }, { status: 401 });
    }

    const customers = await base44.asServiceRole.entities.Customer.filter({ session_token });
    if (customers.length === 0) {
      return Response.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const customer = customers[0];
    delete customer.password_hash;
    delete customer.session_token;

    return Response.json({
      customer: {
        id: customer.id,
        email: customer.email,
        full_name: customer.full_name,
        subscription_status: customer.subscription_status,
        trial_ends_at: customer.trial_ends_at,
        subscription_plan: customer.subscription_plan,
        stripe_customer_id: customer.stripe_customer_id,
        trade: customer.trade,
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});