import { entities } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';
import bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { reset_token, password } = await req.json();

    const isPlainString = (v) => typeof v === 'string' && !v.startsWith('$');
    if (!isPlainString(reset_token) || !isPlainString(password)) {
      return Response.json({ error: 'Reset token and new password are required' }, { status: 400, headers: corsHeaders });
    }

    if (password.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400, headers: corsHeaders });
    }

    const customers = await entities.Customer.filter({ reset_token });
    if (customers.length === 0) {
      return Response.json({ error: 'Invalid or expired reset token' }, { status: 400, headers: corsHeaders });
    }

    const customer = customers[0];

    if (customer.reset_token_expires_at && new Date(customer.reset_token_expires_at) < new Date()) {
      return Response.json({ error: 'Reset token has expired. Please request a new one.' }, { status: 400, headers: corsHeaders });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const session_token = crypto.randomUUID() + '-' + crypto.randomUUID();

    await entities.Customer.update(customer.id, {
      password_hash,
      session_token,
      reset_token: null,
      reset_token_expires_at: null,
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
      },
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('resetPassword error:', error);
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
