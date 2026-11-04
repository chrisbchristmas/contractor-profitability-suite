import { entities, sendEmail } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';
import bcrypt from 'npm:bcryptjs@2.4.3';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

const rateLimitMap = new Map();
function checkRateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= maxRequests;
}

function getClientIp(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const ip = getClientIp(req);

    if (!checkRateLimit(`deleteAccount:${ip}`, 5, 60_000)) {
      return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429, headers: corsHeaders });
    }

    const { session_token, password } = await req.json();

    if (!session_token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }
    if (!password) {
      return Response.json({ error: 'Please re-enter your password to confirm account deletion.' }, { status: 400, headers: corsHeaders });
    }

    const customers = await entities.Customer.filter({ session_token });
    if (!customers || customers.length === 0) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }
    const customer = customers[0];

    if (customer.session_token !== session_token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const passwordValid = await bcrypt.compare(password, customer.password_hash);
    if (!passwordValid) {
      return Response.json({ error: 'Incorrect password. Please re-enter your password to delete your account.' }, { status: 403, headers: corsHeaders });
    }

    if (customer.stripe_customer_id) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.stripe_customer_id,
        status: 'all',
        limit: 10,
      });

      for (const sub of subscriptions.data) {
        if (['active', 'trialing', 'past_due'].includes(sub.status)) {
          await stripe.subscriptions.cancel(sub.id);
        }
      }
    }

    await sendEmail({
      to: customer.email,
      subject: 'Account Deleted - Contractor Profitability Suite',
      body: `Your account (${customer.email}) has been permanently deleted and any active subscriptions or free trials have been cancelled. You will not be charged going forward.\n\nIf you did not request this, please contact support immediately.`,
    });

    await entities.Customer.delete(customer.id);

    return Response.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
