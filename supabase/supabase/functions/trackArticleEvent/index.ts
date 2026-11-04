import { entities } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';

const rateLimitMap = new Map();
function checkRateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= maxRequests;
}

function getClientIp(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const ip = getClientIp(req);

    if (!checkRateLimit(`trackArticle:${ip}`, 30, 60_000)) {
      return Response.json({ error: 'Too many requests.' }, { status: 429, headers: corsHeaders });
    }

    const { slug, event_type } = await req.json();

    if (!slug || !event_type) {
      return Response.json({ error: 'slug and event_type required' }, { status: 400, headers: corsHeaders });
    }

    if (!['view', 'cta_click', 'signup'].includes(event_type)) {
      return Response.json({ error: 'Invalid event_type' }, { status: 400, headers: corsHeaders });
    }

    const articles = await entities.SeoArticle.filter({ slug });
    if (!articles.length) {
      return Response.json({ error: 'Article not found' }, { status: 404, headers: corsHeaders });
    }

    const article = articles[0];
    const update = {};

    if (event_type === 'view') {
      if (!checkRateLimit(`view:${ip}:${slug}`, 1, 10 * 60_000)) {
        return Response.json({ success: true, deduplicated: true }, { headers: corsHeaders });
      }
      update.views = (article.views || 0) + 1;
    } else if (event_type === 'cta_click') {
      if (!checkRateLimit(`cta:${ip}:${slug}`, 1, 5 * 60_000)) {
        return Response.json({ success: true, deduplicated: true }, { headers: corsHeaders });
      }
      update.clicks_to_calculator = (article.clicks_to_calculator || 0) + 1;
    } else if (event_type === 'signup') {
      update.signups_generated = (article.signups_generated || 0) + 1;
    }

    await entities.SeoArticle.update(article.id, update);

    return Response.json({ success: true, event_type, slug }, { headers: corsHeaders });
  } catch (error) {
    console.error('trackArticleEvent error:', error.message);
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
