import { entities, sendEmail } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || email.startsWith('$')) {
      return Response.json({ error: 'Email is required' }, { status: 400, headers: corsHeaders });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const customers = await entities.Customer.filter({ email: normalizedEmail });

    if (customers.length > 0) {
      const customer = customers[0];

      const reset_token = crypto.randomUUID() + '-' + crypto.randomUUID();
      const reset_token_expires_at = new Date();
      reset_token_expires_at.setHours(reset_token_expires_at.getHours() + 1);

      await entities.Customer.update(customer.id, {
        reset_token,
        reset_token_expires_at: reset_token_expires_at.toISOString(),
      });

      const APP_BASE_URL = 'https://contractorprofitabilitysuite.com';
      const resetUrl = `${APP_BASE_URL}/login?reset_token=${reset_token}`;

      await sendEmail({
        to: normalizedEmail,
        subject: 'Reset your Contractor Pro password',
        body: `<p>Hi ${customer.full_name || 'there'},</p>
<p>We received a request to reset your Contractor Pro password.</p>
<p>Click the link below to set a new password. This link expires in 1 hour:</p>
<p><a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Reset Password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>— Contractor Pro Team</p>`,
      });
    }

    return Response.json({
      message: 'If an account exists with that email, a reset link has been sent.',
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('forgotPassword error:', error);
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
