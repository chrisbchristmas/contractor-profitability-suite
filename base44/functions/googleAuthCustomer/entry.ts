import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verify the caller is authenticated via platform auth (Google OAuth sets this)
    let user;
    try {
      user = await base44.auth.me();
    } catch {
      return Response.json({ error: 'Google authentication required' }, { status: 401 });
    }

    if (!user || !user.email) {
      return Response.json({ error: 'Google authentication required' }, { status: 401 });
    }

    const normalizedEmail = user.email.toLowerCase().trim();

    // Find or create Customer record for this Google-authenticated user
    const customers = await base44.asServiceRole.entities.Customer.filter({ email: normalizedEmail });
    let customer = customers[0];

    const session_token = crypto.randomUUID() + '-' + crypto.randomUUID();

    if (customer) {
      // Existing Customer — refresh session token
      await base44.asServiceRole.entities.Customer.update(customer.id, { session_token });
    } else {
      // No Customer record — auto-create one (no password needed for Google users)
      const trial_ends_at = new Date();
      trial_ends_at.setDate(trial_ends_at.getDate() + 14);

      customer = await base44.asServiceRole.entities.Customer.create({
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
    });
  } catch (error) {
    console.error('googleAuthCustomer error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});