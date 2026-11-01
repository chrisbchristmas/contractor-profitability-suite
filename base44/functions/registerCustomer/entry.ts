import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, password, full_name } = await req.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if customer already exists
    const existing = await base44.asServiceRole.entities.Customer.filter({ email: normalizedEmail });
    if (existing.length > 0) {
      return Response.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Generate session token
    const session_token = crypto.randomUUID() + '-' + crypto.randomUUID();

    // Set trial end date (14 days)
    const trial_ends_at = new Date();
    trial_ends_at.setDate(trial_ends_at.getDate() + 14);

    // Create customer
    const customer = await base44.asServiceRole.entities.Customer.create({
      email: normalizedEmail,
      password_hash,
      session_token,
      full_name: full_name || '',
      subscription_status: 'trial',
      trial_ends_at: trial_ends_at.toISOString(),
    });

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
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});