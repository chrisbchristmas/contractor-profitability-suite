import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Prevent NoSQL injection: reject any input containing MongoDB operators ($gt, $ne, $regex, etc.)
    const isPlainString = (v) => typeof v === 'string' && !v.startsWith('$');
    if (!isPlainString(email) || !isPlainString(password)) {
      return Response.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find customer — email is now guaranteed to be a plain string with no $-operators
    const customers = await base44.asServiceRole.entities.Customer.filter({ email: normalizedEmail });
    let customer = customers[0];

    // If no Customer record exists, check for a platform User with the same email.
    // Auto-create a Customer record so billing/checkout works for users who
    // registered through platform auth before this fix.
    if (!customer) {
      const users = await base44.asServiceRole.entities.User.filter({ email: normalizedEmail });
      if (users.length === 0) {
        return Response.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      const password_hash = await bcrypt.hash(password, 10);
      const session_token = crypto.randomUUID() + '-' + crypto.randomUUID();
      const trial_ends_at = new Date();
      trial_ends_at.setDate(trial_ends_at.getDate() + 14);

      customer = await base44.asServiceRole.entities.Customer.create({
        email: normalizedEmail,
        password_hash,
        session_token,
        full_name: users[0].full_name || '',
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
    }

    // Verify password
    const valid = await bcrypt.compare(password, customer.password_hash);
    if (!valid) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Generate new session token
    const session_token = crypto.randomUUID() + '-' + crypto.randomUUID();

    await base44.asServiceRole.entities.Customer.update(customer.id, { session_token });

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