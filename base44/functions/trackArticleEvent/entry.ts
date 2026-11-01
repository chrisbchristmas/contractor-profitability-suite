import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// --- In-memory rate limiter (best-effort, per-instance) ---
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

// Tracks: view, cta_click, signup events for SEO articles
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const b = base44.asServiceRole;

    const ip = getClientIp(req);

    // Rate limit: 30 requests per minute per IP
    if (!checkRateLimit(`trackArticle:${ip}`, 30, 60_000)) {
      return Response.json({ error: 'Too many requests.' }, { status: 429 });
    }

    const { slug, event_type } = await req.json();

    if (!slug || !event_type) {
      return Response.json({ error: 'slug and event_type required' }, { status: 400 });
    }

    if (!['view', 'cta_click', 'signup'].includes(event_type)) {
      return Response.json({ error: 'Invalid event_type' }, { status: 400 });
    }

    // Find article by slug
    const articles = await b.entities.SeoArticle.filter({ slug });
    if (!articles.length) {
      return Response.json({ error: 'Article not found' }, { status: 404 });
    }

    const article = articles[0];
    const update = {};

    if (event_type === 'view') {
      // Deduplicate views: one view per IP per article per 10 minutes
      if (!checkRateLimit(`view:${ip}:${slug}`, 1, 10 * 60_000)) {
        return Response.json({ success: true, deduplicated: true });
      }
      update.views = (article.views || 0) + 1;
    } else if (event_type === 'cta_click') {
      // Deduplicate: one cta_click per IP per article per 5 minutes
      if (!checkRateLimit(`cta:${ip}:${slug}`, 1, 5 * 60_000)) {
        return Response.json({ success: true, deduplicated: true });
      }
      update.clicks_to_calculator = (article.clicks_to_calculator || 0) + 1;
    } else if (event_type === 'signup') {
      update.signups_generated = (article.signups_generated || 0) + 1;
    }

    await b.entities.SeoArticle.update(article.id, update);

    return Response.json({ success: true, event_type, slug });
  } catch (error) {
    console.error('trackArticleEvent error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});