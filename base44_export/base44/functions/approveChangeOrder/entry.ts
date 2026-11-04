import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { token, signer_name, agreed } = await req.json();

    // NoSQL injection prevention: reject non-string or $-prefixed values
    if (!token || typeof token !== 'string' || token.startsWith('$')) {
      return Response.json({ error: 'Invalid token' }, { status: 400 });
    }
    if (!signer_name || !signer_name.trim()) return Response.json({ error: 'Please type your full name as your signature' }, { status: 400 });
    if (!agreed) return Response.json({ error: 'You must check the agreement box to approve' }, { status: 400 });

    // Find CO by token (service role — public endpoint, no login)
    const cos = await base44.asServiceRole.entities.ChangeOrder.filter({ approval_token: token });
    const co = cos?.[0];
    if (!co) return Response.json({ error: 'Change order not found' }, { status: 404 });

    if (co.status === 'approved') {
      return Response.json({ error: 'This change order has already been signed and approved' }, { status: 400 });
    }
    if (co.status === 'declined') {
      return Response.json({ error: 'This change order was already declined' }, { status: 400 });
    }

    // Capture IP address if available
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || req.headers.get('x-real-ip')
            || null;

    const now = new Date().toISOString();

    await base44.asServiceRole.entities.ChangeOrder.update(co.id, {
      status: 'approved',
      signer_name: signer_name.trim(),
      signed_at: now,
      signer_ip: ip,
      approved_at: now,
      approval_method: 'e_signature',
    });

    return Response.json({ success: true, signer_name: signer_name.trim(), signed_at: now });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});