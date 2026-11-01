import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Automation calls pass a private secret via function_args; manual calls require admin auth
    const automationSecret = Deno.env.get('AUTOMATION_SECRET_KEY');
    const isAutomationCall = typeof automationSecret === 'string' && automationSecret !== '' && body?.automation_secret === automationSecret;
    if (!isAutomationCall) {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const b = base44.asServiceRole;

    // 1. Pick next draft SeoArticle without content
    const drafts = await b.entities.SeoArticle.filter({ status: 'draft' });
    const pending = drafts.filter(a => !a.content);
    if (!pending.length) {
      return Response.json({ message: 'No pending draft articles found.' });
    }
    const article = pending[0];

    // 2. Get all published articles for internal linking
    const published = await b.entities.SeoArticle.filter({ status: 'published' });

    // Pick 3 random published articles (excluding current)
    const others = published.filter(a => a.id !== article.id);
    const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3);
    const internalLinks = shuffled.map(a => ({
      title: a.title,
      slug: a.slug,
      url: `/BlogPost?slug=${a.slug}`
    }));

    const internalLinksHtml = internalLinks.length > 0
      ? `<section class="internal-links"><h2>Related Articles</h2><ul>${internalLinks.map(l => `<li><a href="${l.url}">${l.title}</a></li>`).join('')}</ul></section>`
      : '';

    // 3. AI-generate full article
    const prompt = `You are an expert construction industry content writer and SEO specialist.

Write a comprehensive, SEO-optimized blog article for a B2B SaaS app called "Construction Change Order Profit Tracker" — a tool that helps contractors accurately price change orders, track job costs, and protect their profit margins.

Primary keyword: "${article.primary_keyword}"

Requirements:
- 1800–2200 words total
- H1: Craft a compelling, keyword-rich title
- Include these H2 sections IN ORDER:
  1. What "${article.primary_keyword}" Means for Contractors
  2. Why Contractors Lose Money (and how it's preventable)
  3. Real-World Example with numbers
  4. How to Calculate Your True Cost (step-by-step)
  5. How Our App Prevents Profit Leakage
  6. Frequently Asked Questions (2–3 FAQs)
- After the last section, include a CTA block (use the placeholder %%CTA%%)
- Naturally use the keyword 4–6 times
- Write in a direct, practical tone for small-to-mid construction business owners
- Include specific dollar figures and percentages to make examples concrete
- Do NOT use markdown. Write clean HTML using <h1>, <h2>, <p>, <ul>, <li>, <strong>, <em> tags only.

Return a JSON object with these exact fields:
{
  "title": "The H1 title (without HTML tags)",
  "content": "Full HTML content with %%CTA%% placeholder",
  "meta_description": "150–160 character SEO meta description",
  "secondary_keywords": ["keyword1", "keyword2", "keyword3"]
}`;

    const aiResult = await b.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          meta_description: { type: 'string' },
          secondary_keywords: { type: 'array', items: { type: 'string' } }
        },
        required: ['title', 'content', 'meta_description', 'secondary_keywords']
      }
    });

    const ctaHtml = `<div class="cta-block" style="background:#1e40af;color:#fff;padding:2rem;border-radius:12px;text-align:center;margin:2rem 0;">
  <h3 style="margin:0 0 0.5rem;font-size:1.5rem;">Stop Losing Money on Change Orders</h3>
  <p style="margin:0 0 1rem;opacity:0.9;">Use our free calculator to see exactly how much profit you're leaving on the table.</p>
  <a href="/billing" style="display:inline-block;background:#fff;color:#1e40af;font-weight:700;padding:0.75rem 2rem;border-radius:8px;text-decoration:none;font-size:1rem;">Try the Free Calculator →</a>
</div>`;

    const finalContent = (aiResult.content || '')
      .replace('%%CTA%%', ctaHtml)
      + internalLinksHtml;

    const slug = (aiResult.title || article.primary_keyword)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const wordCount = finalContent.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

    // 4. Update the article record
    await b.entities.SeoArticle.update(article.id, {
      title: aiResult.title,
      slug,
      content: finalContent,
      meta_description: aiResult.meta_description,
      secondary_keywords: aiResult.secondary_keywords || [],
      status: 'published',
      publish_date: new Date().toISOString(),
      word_count: wordCount,
      views: 0,
      clicks_to_calculator: 0,
      signups_generated: 0
    });

    console.log(`Published article: "${aiResult.title}" (slug: ${slug})`);
    return Response.json({
      success: true,
      article_id: article.id,
      title: aiResult.title,
      slug,
      word_count: wordCount,
      internal_links_added: internalLinks.length
    });
  } catch (error) {
    console.error('autoPublishArticle error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});