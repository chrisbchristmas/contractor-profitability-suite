import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { change_order_id } = await req.json();
    if (!change_order_id) return Response.json({ error: 'change_order_id required' }, { status: 400 });

    // Verify the CO exists and the user has access (RLS-enforced)
    const co = await base44.entities.ChangeOrder.get(change_order_id);
    if (!co) return Response.json({ error: 'Change order not found' }, { status: 404 });

    // Reuse existing token or generate a new unguessable one
    const token = co.approval_token || crypto.randomUUID();

    await base44.entities.ChangeOrder.update(change_order_id, {
      status: 'sent',
      approval_token: token,
    });

    const origin = new URL(req.url).origin;
    const approval_url = `${origin}/ApproveChangeOrder?token=${token}`;

    return Response.json({ approval_url, token });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});