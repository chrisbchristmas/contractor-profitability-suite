import { entities } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { token, signer_name, agreed } = await req.json();

    if (!token || typeof token !== 'string' || token.startsWith('$')) {
      return Response.json({ error: 'Invalid token' }, { status: 400, headers: corsHeaders });
    }
    if (!signer_name || !signer_name.trim()) {
      return Response.json({ error: 'Please type your full name as your signature' }, { status: 400, headers: corsHeaders });
    }
    if (!agreed) {
      return Response.json({ error: 'You must check the agreement box to approve' }, { status: 400, headers: corsHeaders });
    }

    const cos = await entities.ChangeOrder.filter({ approval_token: token });
    const co = cos?.[0];
    if (!co) return Response.json({ error: 'Change order not found' }, { status: 404, headers: corsHeaders });

    if (co.status === 'approved') {
      return Response.json({ error: 'This change order has already been signed and approved' }, { status: 400, headers: corsHeaders });
    }
    if (co.status === 'declined') {
      return Response.json({ error: 'This change order was already declined' }, { status: 400, headers: corsHeaders });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || null;

    const now = new Date().toISOString();

    await entities.ChangeOrder.update(co.id, {
      status: 'approved',
      signer_name: signer_name.trim(),
      signed_at: now,
      signer_ip: ip,
      approved_at: now,
      approval_method: 'e_signature',
    });

    return Response.json({ success: true, signer_name: signer_name.trim(), signed_at: now }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
