import { entities, findUserByEmail } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';
import bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400, headers: corsHeaders });
    }

    const isPlainString = (v) => typeof v === 'string' && !v.startsWith('$');
    if (!isPlainString(email) || !isPlainString(password)) {
      return Response.json({ error: 'Invalid email or password' }, { status: 400, headers: corsHeaders });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const customers = await entities.Customer.filter({ email: normalizedEmail });
    let customer = customers[0];

    if (!customer) {
      const user = await findUserByEmail(normalizedEmail);
      if (!user) {
        return Response.json({ error: 'Invalid email or password' }, { status: 401, headers: corsHeaders });
      }

      const password_hash = await bcrypt.hash(password, 10);
      const session_token = crypto.randomUUID() + '-' + crypto.randomUUID();
      const trial_ends_at = new Date();
      trial_ends_at.setDate(trial_ends_at.getDate() + 14);

      customer = await entities.Customer.create({
        email: normalizedEmail,
        password_hash,
        session_token,
        full_name: user.full_name || '',
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
    }

    const valid = await bcrypt.compare(password, customer.password_hash);
    if (!valid) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401, headers: corsHeaders });
    }

    const session_token = crypto.randomUUID() + '-' + crypto.randomUUID();
    await entities.Customer.update(customer.id, { session_token });

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
