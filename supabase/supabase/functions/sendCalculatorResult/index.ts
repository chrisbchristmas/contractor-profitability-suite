import { entities, sendEmail } from '../_shared/base44compat.ts';
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fmt(n) {
  return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const ip = getClientIp(req);

    if (!checkRateLimit(`calcEmail:${ip}`, 3, 60 * 60_000)) {
      return Response.json({ error: 'Too many email requests. Please try again later.' }, { status: 429, headers: corsHeaders });
    }

    const body = await req.json();
    const { email, results } = body || {};

    if (!email || !EMAIL_RE.test(email)) {
      return Response.json({ error: 'Valid email address required' }, { status: 400, headers: corsHeaders });
    }

    if (email.length > 254) {
      return Response.json({ error: 'Email address too long' }, { status: 400, headers: corsHeaders });
    }

    const trueCost = Number(results?.true_cost) || 0;
    const clientPrice = Number(results?.client_price) || 0;
    const profit = Number(results?.profit) || 0;
    const actualMargin = Number(results?.actual_margin_percent) || 0;
    const profitPerHour = Number(results?.profit_per_hour) || 0;
    const laborHours = Number(results?.labor_hours) || 0;

    const body_text = `Here are your change order profit calculation results:

True Cost:    $${fmt(trueCost)}
Client Price: $${fmt(clientPrice)}
Profit:       $${fmt(profit)}
Margin:       ${actualMargin.toFixed(1)}%
Profit/Hr:    ${laborHours > 0 ? '$' + fmt(profitPerHour) : 'N/A'}

Run more calculations at https://contractorprofitabilitysuite.com/free-change-order-calculator`;

    await sendEmail({
      to: email,
      subject: 'Your Change Order Profit Calculation',
      text: body_text,
      body: `<pre style="font-family:inherit;white-space:pre-wrap;">${body_text.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</pre>`,
    });

    await entities.CalculatorUsage.create({
      emailed_result_to: email,
      referrer: req.headers.get('referer') || '',
      user_agent: req.headers.get('user-agent') || '',
    });

    return Response.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
