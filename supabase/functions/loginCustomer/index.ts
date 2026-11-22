import { entities } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { newSessionToken, rateLimited, tooMany } from '../_shared/security.ts';
import bcrypt from 'npm:bcryptjs@2.4.3';

const DUMMY_HASH = bcrypt.hashSync(crypto.randomUUID(), 10);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    if (await rateLimited(req, 'loginCustomer')) return tooMany(corsHeaders);
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
      // No auto-provisioning from platform users: that allowed account pre-hijack with an arbitrary password.
      await bcrypt.compare(password, DUMMY_HASH); // constant-ish timing
      return Response.json({ error: 'Invalid email or password' }, { status: 401, headers: corsHeaders });
    }

    // DB-backed lockout (the in-memory limiter resets per isolate): 10 bad passwords locks the account 15 min.
    if (customer.locked_until && new Date(customer.locked_until) > new Date()) {
      return tooMany(corsHeaders);
    }

    const valid = await bcrypt.compare(password, customer.password_hash || DUMMY_HASH) && !!customer.password_hash; // Google-only accounts have no hash
    if (!valid) {
      const fails = (customer.failed_logins ?? 0) + 1;
      await entities.Customer.update(customer.id, fails >= 10
        ? { failed_logins: 0, locked_until: new Date(Date.now() + 15 * 60 * 1000).toISOString() }
        : { failed_logins: fails });
      return Response.json({ error: 'Invalid email or password' }, { status: 401, headers: corsHeaders });
    }

    const session_token = newSessionToken();
    await entities.Customer.update(customer.id, { session_token, failed_logins: 0, locked_until: null });

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
        role: 'Owner', // single-tenant account, no team/invite feature
      }
    }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500, headers: corsHeaders });
  }
});
