import { entities, authMe } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';

const KEYWORDS = [
  "construction change order example",
  "change order template construction",
  "how to price a change order",
  "change order markup construction",
  "change order profit margin",
  "change order mistakes contractors make",
  "contractor change order calculator",
  "construction change order process",
  "change order negotiation tips",
  "why contractors lose money on change orders",
  "how contractors calculate profit",
  "contractor markup vs margin",
  "construction overhead calculation",
  "how to price construction jobs",
  "why contractors underbid jobs",
  "contractor profit formula",
  "how to calculate labor burden",
  "construction project profit tracking",
  "contractor cost tracking system",
  "construction estimating mistakes",
  "best apps for small contractors",
  "construction job tracking software",
  "simple contractor project management",
  "tools to track construction profit",
  "contractor job cost tracking",
  "construction estimate tracking",
  "best software for small construction companies",
  "contractor productivity tools",
  "apps for construction business owners",
  "contractor business automation",
  "how contractors price labor",
  "how much markup contractors charge",
  "contractor pricing strategy",
  "construction cost breakdown example",
  "how to track construction job costs",
  "contractor overhead percentage",
  "construction labor cost calculation",
  "construction material markup",
  "contractor profit per job",
  "construction budget tracking",
  "how remodeling contractors price jobs",
  "roofing contractor pricing guide",
  "electrician job pricing formula",
  "plumbing job cost calculation",
  "painting contractor pricing guide",
  "contractor losing money on jobs",
  "why construction businesses fail",
  "biggest mistakes small contractors make",
  "how to run a profitable construction company",
  "contractor profit secrets"
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const user = await authMe(req);

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403, headers: corsHeaders });
    }

    const existing = await entities.SeoArticle.list();
    const existingKeywords = new Set(existing.map(a => a.primary_keyword?.toLowerCase()));

    const toInsert = KEYWORDS.filter(k => !existingKeywords.has(k.toLowerCase()));

    console.log(`seedKeywords: inserting ${toInsert.length} new keywords (${KEYWORDS.length - toInsert.length} already exist)`);

    if (toInsert.length === 0) {
      return Response.json({ message: 'All keywords already seeded', total: existing.length }, { headers: corsHeaders });
    }

    const records = toInsert.map(keyword => ({
      primary_keyword: keyword,
      status: 'draft'
    }));

    await entities.SeoArticle.bulkCreate(records);

    console.log(`seedKeywords: successfully seeded ${toInsert.length} keywords`);

    return Response.json({
      success: true,
      seeded: toInsert.length,
      skipped: KEYWORDS.length - toInsert.length,
      total_in_db: existing.length + toInsert.length
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('seedKeywords error:', error);
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
