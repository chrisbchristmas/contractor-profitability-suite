import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const KEYWORDS = [
  // Change Order Core
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
  // Contractor Profit Optimization
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
  // Contractor Tools / Systems
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
  // High Traffic Contractor Questions
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
  // Local Contractor SEO
  "how remodeling contractors price jobs",
  "roofing contractor pricing guide",
  "electrician job pricing formula",
  "plumbing job cost calculation",
  "painting contractor pricing guide",
  // Viral Traffic Topics
  "contractor losing money on jobs",
  "why construction businesses fail",
  "biggest mistakes small contractors make",
  "how to run a profitable construction company",
  "contractor profit secrets"
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Check which keywords already exist to avoid duplicates
    const existing = await base44.asServiceRole.entities.SeoArticle.list();
    const existingKeywords = new Set(existing.map(a => a.primary_keyword?.toLowerCase()));

    const toInsert = KEYWORDS.filter(k => !existingKeywords.has(k.toLowerCase()));

    console.log(`seedKeywords: inserting ${toInsert.length} new keywords (${KEYWORDS.length - toInsert.length} already exist)`);

    if (toInsert.length === 0) {
      return Response.json({ message: 'All keywords already seeded', total: existing.length });
    }

    const records = toInsert.map(keyword => ({
      primary_keyword: keyword,
      status: 'draft'
    }));

    await base44.asServiceRole.entities.SeoArticle.bulkCreate(records);

    console.log(`seedKeywords: successfully seeded ${toInsert.length} keywords`);

    return Response.json({
      success: true,
      seeded: toInsert.length,
      skipped: KEYWORDS.length - toInsert.length,
      total_in_db: existing.length + toInsert.length
    });

  } catch (error) {
    console.error('seedKeywords error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});