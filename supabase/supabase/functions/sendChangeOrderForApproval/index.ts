import { entities, authMe } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const user = await authMe(req);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

    const { change_order_id } = await req.json();
    if (!change_order_id) return Response.json({ error: 'change_order_id required' }, { status: 400, headers: corsHeaders });

    const co = await entities.ChangeOrder.get(change_order_id);
    if (!co) return Response.json({ error: 'Change order not found' }, { status: 404, headers: corsHeaders });

    const token = co.approval_token || crypto.randomUUID();

    await entities.ChangeOrder.update(change_order_id, {
      status: 'sent',
      approval_token: token,
    });

    const origin = new URL(req.url).origin;
    const approval_url = `${origin}/ApproveChangeOrder?token=${token}`;

    return Response.json({ approval_url, token }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
