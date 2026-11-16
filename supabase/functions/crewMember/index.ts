import { supa } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getOwner, hasPro } from '../_shared/owner.ts';

const json = (b: unknown, status = 200) => Response.json(b, { status, headers: corsHeaders });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const owner = await getOwner(req, body.session_token);
    if (!owner) return json({ error: 'Unauthorized' }, 401);
    const ownerId = owner.user.id;

    if (body.action === 'list') {
      const { data } = await supa.from('crew_member').select('id,name,email,labor_rate,active,created_date').eq('owner_id', ownerId).eq('active', true).order('name');
      return json({ crew: data || [], pro: hasPro(owner.customer) });
    }

    if (body.action === 'add') {
      if (!hasPro(owner.customer)) return json({ error: 'Crew logins are a Pro feature. Upgrade in Billing.' }, 403);
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const labor_rate = body.labor_rate === '' || body.labor_rate == null ? null : Number(body.labor_rate);
      if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'Name and a valid email are required' }, 400);
      if (password.length < 8) return json({ error: 'Password must be at least 8 characters' }, 400);
      if (labor_rate != null && !(labor_rate >= 0)) return json({ error: 'Invalid hourly rate' }, 400);
      if (email === (owner.customer.email || '').toLowerCase()) return json({ error: 'Use a different email from your own login' }, 400);

      // Never create a password login for an email that owns (or could own) a Customer account.
      const { data: cust } = await supa.from('customer').select('id').eq('email', email).limit(1);
      if (cust && cust.length) return json({ error: 'That email already has an account' }, 400);

      const { data: created, error } = await supa.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { crew: true } });
      if (error) return json({ error: /registered|exists/i.test(error.message) ? 'That email already has an account' : error.message }, 400);
      const uid = created.user.id;
      // Role 'crew' fails every owner/pm/admin insert policy; crew can only write via the *_crew_create policies.
      const { error: roleErr } = await supa.from('app_user').upsert({ id: uid, role: 'crew' });
      const { error: cmErr } = roleErr ? { error: roleErr } : await supa.from('crew_member').insert({
        owner_id: ownerId, owner_email: owner.customer.email, user_id: uid, name, email, labor_rate,
      });
      if (cmErr) { await supa.auth.admin.deleteUser(uid); return json({ error: cmErr.message }, 500); }
      return json({ success: true });
    }

    if (body.action === 'remove') {
      const { data: cm } = await supa.from('crew_member').select('*').eq('id', body.id).eq('owner_id', ownerId).maybeSingle();
      if (!cm) return json({ error: 'Not found' }, 404);
      await supa.from('crew_member').update({ active: false }).eq('id', cm.id);
      await supa.auth.admin.deleteUser(cm.user_id);
      return json({ success: true });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
});
