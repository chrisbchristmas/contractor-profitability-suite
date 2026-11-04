// NOTE: Requires ANTHROPIC_API_KEY (used by invokeLLM) as a Supabase Edge Function secret.
import { entities, authMe, invokeLLM } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));

    const automationSecret = Deno.env.get('AUTOMATION_SECRET_KEY');
    const isAutomationCall = typeof automationSecret === 'string' && automationSecret !== '' && body?.automation_secret === automationSecret;
    if (!isAutomationCall) {
      const user = await authMe(req);
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders });
    }

    const articles = await entities.SeoArticle.filter({ status: 'published' });
    const underperforming = articles.filter(a => {
      const views = a.views || 0;
      const signups = a.signups_generated || 0;
      if (views < 10) return false;
      const rate = views > 0 ? (signups / views) * 100 : 0;
      return rate < 1;
    });

    if (!underperforming.length) {
      return Response.json({ message: 'No underperforming articles found.', checked: articles.length }, { headers: corsHeaders });
    }

    const results = [];

    for (const article of underperforming.slice(0, 1)) {
      const prompt = `You are an expert construction industry content writer and conversion rate optimizer.

Rewrite the following article to dramatically improve its conversion rate. The goal is to get contractors to click "Try the Free Calculator" CTA.

Primary keyword: "${article.primary_keyword}"
Current title: "${article.title}"
Current meta: "${article.meta_description}"

Rewriting goals:
- Make the headline more compelling and urgent
- Add more specific dollar-figure examples (e.g., "losing $4,200 per job")
- Strengthen the pain points in the opening
- Make the CTA section more persuasive
- Keep 1800–2200 words
- Use clean HTML only (<h1>, <h2>, <p>, <ul>, <li>, <strong>)
- Include %%CTA%% placeholder where the CTA block should go

Original content:
${(article.content || '').substring(0, 3000)}...

Return JSON:
{
  "title": "New improved title",
  "content": "Full rewritten HTML content with %%CTA%% placeholder",
  "meta_description": "New 150-160 char meta description"
}`;

      const aiResult = await invokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            meta_description: { type: 'string' }
          },
          required: ['title', 'content', 'meta_description']
        }
      });

      const ctaHtml = `<div class="cta-block" style="background:#1e40af;color:#fff;padding:2rem;border-radius:12px;text-align:center;margin:2rem 0;">
  <h3 style="margin:0 0 0.5rem;font-size:1.5rem;">Stop Losing Money on Change Orders</h3>
  <p style="margin:0 0 1rem;opacity:0.9;">Use our free calculator to see exactly how much profit you're leaving on the table.</p>
  <a href="/billing" style="display:inline-block;background:#fff;color:#1e40af;font-weight:700;padding:0.75rem 2rem;border-radius:8px;text-decoration:none;font-size:1rem;">Try the Free Calculator →</a>
</div>`;

      const finalContent = (aiResult.content || '').replace('%%CTA%%', ctaHtml);

      await entities.SeoArticle.update(article.id, {
        title: aiResult.title,
        content: finalContent,
        meta_description: aiResult.meta_description,
        publish_date: new Date().toISOString()
      });

      results.push({ id: article.id, title: aiResult.title });
      console.log(`Rewrote underperforming article: "${aiResult.title}"`);
    }

    return Response.json({ success: true, rewrote: results.length, articles: results }, { headers: corsHeaders });
  } catch (error) {
    console.error('rewriteUnderperforming error:', error.message);
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
