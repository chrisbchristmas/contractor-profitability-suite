import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BASE_URL = 'https://contractorprofitabilitysuite.com';

// Only genuinely public, non-authenticated marketing/legal/content pages.
// Authenticated in-app routes (Dashboard, Jobs, Invoices, Estimates, etc.),
// redirect-only routes (/CalculatorHub -> /free-change-order-calculator,
// /pricing -> /Billing, /invoices -> /Invoices), and duplicate
// PascalCase/kebab-case aliases are intentionally excluded to avoid
// soft-404s and redirect errors in Google Search Console.
const PUBLIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/Resources', priority: '0.8', changefreq: 'weekly' },
  { path: '/free-change-order-calculator', priority: '0.9', changefreq: 'monthly' },
  { path: '/free-job-costing-calculator', priority: '0.9', changefreq: 'monthly' },
  { path: '/calculators', priority: '0.7', changefreq: 'monthly' },
  { path: '/calculators/job-costing-calculator', priority: '0.7', changefreq: 'monthly' },
  { path: '/calculators/pricing-model-analyser', priority: '0.7', changefreq: 'monthly' },
  { path: '/calculators/labor-burden-calculator', priority: '0.7', changefreq: 'monthly' },
  { path: '/pricing', priority: '0.6', changefreq: 'monthly' },
  { path: '/compare', priority: '0.7', changefreq: 'monthly' },
  { path: '/compare/jobber', priority: '0.7', changefreq: 'monthly' },
  { path: '/compare/housecall-pro', priority: '0.7', changefreq: 'monthly' },
  { path: '/compare/quickbooks', priority: '0.7', changefreq: 'monthly' },
  { path: '/compare/buildertrend', priority: '0.7', changefreq: 'monthly' },
  { path: '/compare/knowify', priority: '0.7', changefreq: 'monthly' },
  { path: '/compare/contractor-foreman', priority: '0.7', changefreq: 'monthly' },
  { path: '/compare/procore', priority: '0.7', changefreq: 'monthly' },
  { path: '/compare/servicetitan', priority: '0.7', changefreq: 'monthly' },
  { path: '/for/hvac', priority: '0.7', changefreq: 'monthly' },
  { path: '/for/electrical', priority: '0.7', changefreq: 'monthly' },
  { path: '/for/plumbing', priority: '0.7', changefreq: 'monthly' },
  { path: '/for/roofing', priority: '0.7', changefreq: 'monthly' },
  { path: '/for/remodeling', priority: '0.7', changefreq: 'monthly' },
  { path: '/login', priority: '0.3', changefreq: 'yearly' },
  { path: '/register', priority: '0.5', changefreq: 'yearly' },
  { path: '/PrivacyPolicy', priority: '0.3', changefreq: 'yearly' },
  { path: '/Terms', priority: '0.3', changefreq: 'yearly' },
  { path: '/Contact', priority: '0.3', changefreq: 'yearly' },
];

function xmlEscape(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all published articles
    const articles = await base44.asServiceRole.entities.SeoArticle.filter({ status: 'published' });

    const today = new Date().toISOString().split('T')[0];

    const staticUrls = PUBLIC_ROUTES.map(r => `  <url>
    <loc>${BASE_URL}${r.path}</loc>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
    <lastmod>${today}</lastmod>
  </url>`).join('\n');

    const articleUrls = articles
      .filter(a => a.slug)
      .map(a => {
        const lastmod = a.publish_date
          ? new Date(a.publish_date).toISOString().split('T')[0]
          : today;
        const slug = xmlEscape(a.slug);
        return `  <url>
    <loc>${BASE_URL}/BlogPost?slug=${slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <lastmod>${lastmod}</lastmod>
  </url>`;
      }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${articleUrls}
</urlset>`;

    console.log(`Sitemap: ${PUBLIC_ROUTES.length} static + ${articles.filter(a=>a.slug).length} articles`);

    return new Response(xml, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' }
    });
  } catch (error) {
    console.error('sitemap error:', error.message);
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' }
    });
  }
});