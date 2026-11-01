import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { token, decline_reason } = await req.json();

    // NoSQL injection prevention: reject non-string or $-prefixed values
    if (!token || typeof token !== 'string' || token.startsWith('$')) {
      return Response.json({ error: 'Invalid token' }, { status: 400 });
    }

    // Find CO by token (service role — public endpoint, no login)
    const cos = await base44.asServiceRole.entities.ChangeOrder.filter({ approval_token: token });
    const co = cos?.[0];
    if (!co) return Response.json({ error: 'Change order not found' }, { status: 404 });

    if (co.status === 'approved') {
      return Response.json({ error: 'This change order has already been approved' }, { status: 400 });
    }
    if (co.status === 'declined') {
      return Response.json({ error: 'This change order has already been declined' }, { status: 400 });
    }

    // Capture IP address if available
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || req.headers.get('x-real-ip')
            || null;

    const now = new Date().toISOString();
    const reason = (typeof decline_reason === 'string' ? decline_reason.trim().slice(0, 1000) : '') || null;

    await base44.asServiceRole.entities.ChangeOrder.update(co.id, {
      status: 'declined',
      declined_at: now,
      decline_reason: reason,
      signer_ip: ip,
    });

    return Response.json({ success: true, declined_at: now });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});