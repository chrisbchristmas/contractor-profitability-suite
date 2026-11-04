import { entities } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { token, decline_reason } = await req.json();

    if (!token || typeof token !== 'string' || token.startsWith('$')) {
      return Response.json({ error: 'Invalid token' }, { status: 400, headers: corsHeaders });
    }

    const cos = await entities.ChangeOrder.filter({ approval_token: token });
    const co = cos?.[0];
    if (!co) return Response.json({ error: 'Change order not found' }, { status: 404, headers: corsHeaders });

    if (co.status === 'approved') {
      return Response.json({ error: 'This change order has already been approved' }, { status: 400, headers: corsHeaders });
    }
    if (co.status === 'declined') {
      return Response.json({ error: 'This change order has already been declined' }, { status: 400, headers: corsHeaders });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || null;

    const now = new Date().toISOString();
    const reason = (typeof decline_reason === 'string' ? decline_reason.trim().slice(0, 1000) : '') || null;

    await entities.ChangeOrder.update(co.id, {
      status: 'declined',
      declined_at: now,
      decline_reason: reason,
      signer_ip: ip,
    });

    return Response.json({ success: true, declined_at: now }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
