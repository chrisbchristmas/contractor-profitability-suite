import { entities, authMe } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { newSessionToken } from '../_shared/security.ts';
import bcrypt from 'npm:bcryptjs@2.4.3';

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

    // Only a genuine OAuth sign-in proves email ownership. Crew logins (owner-chosen password) and
    // magic-link data sessions must never be exchangeable for a Customer session (account takeover).
    let amr: { method?: string }[] = [];
    try {
      const tok = (req.headers.get('Authorization') || '').replace('Bearer ', '');
      const p = tok.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      amr = JSON.parse(atob(p + '='.repeat((4 - p.length % 4) % 4))).amr || [];
    } catch { /* falls through to reject */ }
    const isOauth = amr.some((a) => a?.method === 'oauth');
    if (!isOauth || user.role === 'crew' || user.user_metadata?.crew) {
      return Response.json({ error: 'Google authentication required' }, { status: 401, headers: corsHeaders });
    }

    const normalizedEmail = user.email.toLowerCase().trim();

    const customers = await entities.Customer.filter({ email: normalizedEmail });
    let customer = customers[0];

    const session_token = newSessionToken();

    if (customer) {
      // Register has no email verification: invalidate any pre-set password (pre-hijack). Owner can use Google or Forgot Password.
      await entities.Customer.update(customer.id, { session_token, password_hash: await bcrypt.hash(crypto.randomUUID(), 10) });
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
        role: 'Owner', // single-tenant account, no team/invite feature
      },
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('googleAuthCustomer error:', error);
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500, headers: corsHeaders });
  }
});
