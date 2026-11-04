import { entities, authMe } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const user = await authMe(req);
    if (!user) {
      return Response.json({ error: 'Unauthorized: user authentication required' }, { status: 401, headers: corsHeaders });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin access required' }, { status: 403, headers: corsHeaders });
    }

    const { article_id } = await req.json();

    const links = [
      {
        anchor: 'Change Order Template',
        url: '/BlogPost?slug=change-order-template-construction'
      },
      {
        anchor: 'Construction Change Order Process',
        url: '/BlogPost?slug=construction-change-order-process'
      },
      {
        anchor: 'Contractor Profit Calculator',
        url: '/BlogPost?slug=contractor-profit-formula'
      }
    ];

    let articles;
    if (article_id) {
      const article = await entities.SeoArticle.get(article_id);
      articles = article ? [article] : [];
    } else {
      articles = (await entities.SeoArticle.filter({ status: 'published' })).slice(0, 10);
    }

    console.log(`autoLinkArticles: processing ${articles.length} articles`);

    let updated = 0;

    for (const article of articles) {
      if (!article.content) continue;

      let content = article.content;
      let insertedCount = 0;

      for (const link of links) {
        if (insertedCount >= 3) break;
        const regex = new RegExp(`(?<!href=")(?<!>)\\b${escapeRegex(link.anchor)}\\b(?!</a>)`, 'i');
        const replacement = `<a href="${link.url}" class="internal-link">${link.anchor}</a>`;
        const before = content;
        content = content.replace(regex, replacement);
        if (content !== before) insertedCount++;
      }

      if (insertedCount > 0) {
        await entities.SeoArticle.update(article.id, { content });
        updated++;
        console.log(`autoLinkArticles: inserted ${insertedCount} links in "${article.title}"`);
      }
    }

    return Response.json({ success: true, articles_updated: updated }, { headers: corsHeaders });

  } catch (error) {
    console.error('autoLinkArticles error:', error);
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
