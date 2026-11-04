import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import bcrypt from 'npm:bcryptjs@2.4.3';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

// --- In-memory rate limiter (best-effort, per-instance) ---
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
  try {
    const base44 = createClientFromRequest(req);
    const ip = getClientIp(req);

    // Rate limit: 5 attempts per minute per IP
    if (!checkRateLimit(`deleteAccount:${ip}`, 5, 60_000)) {
      return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const { session_token, password } = await req.json();

    if (!session_token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!password) {
      return Response.json({ error: 'Please re-enter your password to confirm account deletion.' }, { status: 400 });
    }

    // Get customer from session token
    const customers = await base44.asServiceRole.entities.Customer.filter({ session_token });
    if (!customers || customers.length === 0) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const customer = customers[0];

    if (customer.session_token !== session_token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Re-authenticate: verify password against stored hash
    const passwordValid = await bcrypt.compare(password, customer.password_hash);
    if (!passwordValid) {
      return Response.json({ error: 'Incorrect password. Please re-enter your password to delete your account.' }, { status: 403 });
    }

    // Cancel Stripe subscription/trial if stripe_customer_id exists
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

    // Send confirmation email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: customer.email,
      subject: "Account Deleted - Contractor Profitability Suite",
      body: `Your account (${customer.email}) has been permanently deleted and any active subscriptions or free trials have been cancelled. You will not be charged going forward.\n\nIf you did not request this, please contact support immediately.`,
    });

    // Delete the customer record
    await base44.asServiceRole.entities.Customer.delete(customer.id);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});