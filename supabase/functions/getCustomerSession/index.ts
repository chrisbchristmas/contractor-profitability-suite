import { entities, supa } from '../_shared/base44compat.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { corsHeaders } from '../_shared/cors.ts';
import { sessionFresh } from '../_shared/security.ts';

// Mint a real Supabase Auth session for this customer so row-level security
// (auth.uid()) can isolate each tenant's data.
async function mintSupabaseSession(email: string) {
  const { data: link, error: linkErr } = await supa.auth.admin.generateLink({ type: 'magiclink', email });
  if (linkErr || !link?.properties?.hashed_token) throw new Error('Could not start data session');
  const anon = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } });
  const { data, error } = await anon.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: (link.properties.verification_type || 'magiclink') as any });
  if (error || !data.session) throw new Error('Could not start data session');
  return { access_token: data.session.access_token, refresh_token: data.session.refresh_token };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { session_token } = await req.json();

    if (!session_token || session_token.length < 32) {
      return Response.json({ error: 'No session token provided' }, { status: 401, headers: corsHeaders });
    }

    const customers = await entities.Customer.filter({ session_token });
    if (customers.length === 0) {
      return Response.json({ error: 'Invalid or expired session' }, { status: 401, headers: corsHeaders });
    }

    if (!sessionFresh(session_token)) {
      return Response.json({ error: 'Invalid or expired session' }, { status: 401, headers: corsHeaders });
    }

    const customer = customers[0];
    delete customer.password_hash;
    delete customer.session_token;

    const supabase_session = await mintSupabaseSession(customer.email);

    return Response.json({
      supabase_session,
      customer: {
        id: customer.id,
        email: customer.email,
        full_name: customer.full_name,
        subscription_status: customer.subscription_status,
        trial_ends_at: customer.trial_ends_at,
        subscription_plan: customer.subscription_plan,
        stripe_customer_id: customer.stripe_customer_id,
        trade: customer.trade,
        // Every Customer account is single-tenant with no team/invite feature,
        // so each customer is always the Owner of their own data. Without this,
        // canViewJob/canEditJob/canViewFinancials (permissions.jsx) see
        // user.role === undefined and silently hide/block everything.
        role: 'Owner',
      }
    }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
