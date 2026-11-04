import { entities, authMe } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    let user;
    try {
      user = await authMe(req);
    } catch {
      return Response.json({ error: 'Google authentication required' }, { status: 401, headers: corsHeaders });
    }

    if (!user || !user.email) {
      return Response.json({ error: 'Google authentication required' }, { status: 401, headers: corsHeaders });
    }

    const normalizedEmail = user.email.toLowerCase().trim();

    const customers = await entities.Customer.filter({ email: normalizedEmail });
    let customer = customers[0];

    const session_token = crypto.randomUUID() + '-' + crypto.randomUUID();

    if (customer) {
      await entities.Customer.update(customer.id, { session_token });
    } else {
      const trial_ends_at = new Date();
      trial_ends_at.setDate(trial_ends_at.getDate() + 14);

      customer = await entities.Customer.create({
        email: normalizedEmail,
        full_name: user.full_name || '',
        session_token,
        subscription_status: 'trial',
        trial_ends_at: trial_ends_at.toISOString(),
      });
    }

    return Response.json({
      session_token,
      customer: {
        id: customer.id,
        email: customer.email,
        full_name: customer.full_name,
        subscription_status: customer.subscription_status,
        trial_ends_at: customer.trial_ends_at,
        subscription_plan: customer.subscription_plan,
        stripe_customer_id: customer.stripe_customer_id,
      },
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('googleAuthCustomer error:', error);
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
