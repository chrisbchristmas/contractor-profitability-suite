import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized: user authentication required' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin access required' }, { status: 403 });
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

    // If article_id provided, process just that one; otherwise process all published
    let articles;
    if (article_id) {
      const article = await base44.asServiceRole.entities.SeoArticle.get(article_id);
      articles = article ? [article] : [];
    } else {
      // Limit to 10 per run to avoid CPU timeout
      articles = (await base44.asServiceRole.entities.SeoArticle.filter({ status: 'published' })).slice(0, 10);
    }

    console.log(`autoLinkArticles: processing ${articles.length} articles`);

    let updated = 0;

    for (const article of articles) {
      if (!article.content) continue;

      let content = article.content;
      let insertedCount = 0;

      for (const link of links) {
        if (insertedCount >= 3) break;
        // Only link the first occurrence that isn't already linked
        const regex = new RegExp(`(?<!href=")(?<!>)\\b${escapeRegex(link.anchor)}\\b(?!</a>)`, 'i');
        const replacement = `<a href="${link.url}" class="internal-link">${link.anchor}</a>`;
        const before = content;
        content = content.replace(regex, replacement);
        if (content !== before) insertedCount++;
      }

      if (insertedCount > 0) {
        await base44.asServiceRole.entities.SeoArticle.update(article.id, { content });
        updated++;
        console.log(`autoLinkArticles: inserted ${insertedCount} links in "${article.title}"`);
      }
    }

    return Response.json({ success: true, articles_updated: updated });

  } catch (error) {
    console.error('autoLinkArticles error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}