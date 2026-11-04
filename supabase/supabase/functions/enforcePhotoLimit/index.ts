import { entities, authMe } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { isValidPhoto } from '../_shared/ssrf.ts';

const MAX_PHOTOS = 8;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));

    const automationKey = Deno.env.get('AUTOMATION_SECRET_KEY');
    const isServiceCall = typeof automationKey === 'string' && automationKey.length > 0 && req.headers.get('x-automation-secret') === automationKey;
    if (!isServiceCall) {
      const user = await authMe(req);
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

      const owned = await entities.ChangeOrder.filter({ id: body.change_order_id });
      if (!owned || owned.length === 0) return Response.json({ error: 'Not found' }, { status: 403, headers: corsHeaders });
    }

    const entityId = body?.event?.entity_id;
    if (!entityId) return Response.json({ ok: true, skipped: true, reason: 'no entity_id' }, { headers: corsHeaders });

    const co = await entities.ChangeOrder.get(entityId);
    if (!co) return Response.json({ ok: true, skipped: true, reason: 'not found' }, { headers: corsHeaders });

    const photos = Array.isArray(co.photos) ? co.photos : [];
    if (photos.length === 0) return Response.json({ ok: true, skipped: true, reason: 'no photos' }, { headers: corsHeaders });

    const validPhotos = [];
    const removedInvalid = [];
    for (const photo of photos) {
      if (await isValidPhoto(photo.url, MAX_FILE_SIZE)) {
        validPhotos.push(photo);
      } else {
        removedInvalid.push(photo.name || photo.url);
      }
    }

    const trimmed = validPhotos.slice(0, MAX_PHOTOS);
    const overflowRemoved = validPhotos.length - trimmed.length;

    if (trimmed.length < photos.length) {
      await entities.ChangeOrder.update(entityId, { photos: trimmed });
      return Response.json({
        ok: true,
        updated: true,
        removed_invalid: removedInvalid,
        removed_overflow: overflowRemoved,
        before: photos.length,
        after: trimmed.length,
      }, { headers: corsHeaders });
    }

    return Response.json({ ok: true, updated: false, count: photos.length }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
