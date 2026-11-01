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

    const { keyword, title } = await req.json();

    if (!keyword) {
      return Response.json({ error: 'keyword is required' }, { status: 400 });
    }

    console.log(`Generating SEO article for keyword: "${keyword}", title: "${title || 'auto'}"`);

    const prompt = `You are an expert construction business consultant and SEO writer.

Write a 1,800–2,200 word SEO article for small contractors.

Primary keyword: "${keyword}"
${title ? `Article title: "${title}"` : `Generate an engaging, SEO-optimized title for the keyword: "${keyword}"`}

Audience:
Small construction contractors, remodelers, roofers, electricians, plumbers.

Goals:
1. Help contractors improve profit
2. Rank on Google for the keyword
3. Naturally promote a "Construction Change Order Profit Tracker" web tool

Article structure:

H1: The article title

Intro (150-200 words):
Explain the real financial problem contractors face related to this keyword.

Body sections - use these H2 headings adapted to the keyword:
H2: What "${keyword}" means in construction
H2: Why contractors lose money (related to this topic)
H2: Real-world example (use specific dollar amounts and scenarios)
H2: How to calculate the true cost
H2: A simple system contractors can use
H2: How a Change Order Profit Tracker fixes the problem (naturally introduce the tool)

Include throughout:
• Contractor-specific examples (roofer, plumber, electrician, remodeler)
• Simple formulas with dollar amounts (e.g. Labor Cost × Burden Rate = True Labor Cost)
• Bullet lists for tips and steps
• Step-by-step instructions where helpful
• 3 internal links to these pages using anchor text exactly as written:
  - "Change Order Template" linking to /blog/change-order-template-construction
  - "Construction Change Order Process" linking to /blog/construction-change-order-process
  - "Contractor Profit Calculator" linking to /blog/contractor-profit-formula

Ending CTA (100 words):
Invite the reader to use a web app (the Change Order Profit Tracker at Contractor Pro) that calculates real change order profit automatically. Make it compelling and action-oriented.

Tone: Clear, practical, contractor-friendly. Avoid jargon. Write like you're talking to a working contractor.

Output ONLY valid JSON (no markdown, no code fences), exactly this shape:
{
  "title": "The article H1 title",
  "meta_description": "150-160 character SEO meta description including the primary keyword",
  "slug": "url-safe-slug-from-title",
  "content": "Full article content in clean HTML using <h1>, <h2>, <p>, <ul>, <li>, <strong> tags only. No inline styles."
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: 'gpt_5',
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          meta_description: { type: 'string' },
          slug: { type: 'string' },
          content: { type: 'string' }
        },
        required: ['title', 'meta_description', 'slug', 'content']
      }
    });

    console.log(`Article generated: "${result.title}" (slug: ${result.slug})`);

    // Estimate word count from HTML content
    const wordCount = result.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

    return Response.json({
      title: result.title,
      meta_description: result.meta_description,
      slug: result.slug,
      content: result.content,
      word_count: wordCount
    });

  } catch (error) {
    console.error('generateSeoArticle error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});