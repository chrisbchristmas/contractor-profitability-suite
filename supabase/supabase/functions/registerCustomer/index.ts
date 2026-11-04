import { entities } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';
import bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { email, password, full_name } = await req.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400, headers: corsHeaders });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await entities.Customer.filter({ email: normalizedEmail });
    if (existing.length > 0) {
      return Response.json({ error: 'An account with this email already exists' }, { status: 409, headers: corsHeaders });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const session_token = crypto.randomUUID() + '-' + crypto.randomUUID();
    const trial_ends_at = new Date();
    trial_ends_at.setDate(trial_ends_at.getDate() + 14);

    const customer = await entities.Customer.create({
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
    }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
