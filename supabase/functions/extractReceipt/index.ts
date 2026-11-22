// Receipt OCR: takes an uploaded receipt image URL, returns { vendor, amount, date, category, note }.
// Uses Claude Haiku vision (fractions of a cent per receipt). Owner + Pro only.
import { getOwner, hasPro } from '../_shared/owner.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { rateLimited } from '../_shared/security.ts';

const CATS = ['labor', 'materials', 'subcontractor', 'equipment_other'];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  // Each call spends Anthropic credit: cap per client.
  if (await rateLimited(req, 'extractReceipt', 40, 60 * 60_000)) return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429, headers: corsHeaders });
  try {
    const { session_token, file_url } = await req.json();
    const owner = await getOwner(req, session_token);
    if (!owner) return json({ error: 'Unauthorized' }, 401);
    if (!hasPro(owner.customer)) return json({ error: 'Receipt scanning is a Pro feature' }, 403);
    if (typeof file_url !== 'string' || !/^https:\/\//.test(file_url)) return json({ error: 'file_url required' }, 400);
    const supaHost = new URL(Deno.env.get('SUPABASE_URL')!).host;
    if (new URL(file_url).host !== supaHost) return json({ error: 'Invalid file host' }, 400);

    const img = await fetch(file_url);
    if (!img.ok) return json({ error: 'Could not read receipt image' }, 400);
    const media = (img.headers.get('content-type') || 'image/jpeg').split(';')[0];
    if (!/^image\/(jpeg|png|webp|gif)$/.test(media)) return json({ error: 'Receipt must be a JPG, PNG or WEBP photo' }, 400);
    const buf = new Uint8Array(await img.arrayBuffer());
    if (buf.length > 5 * 1024 * 1024) return json({ error: 'Image too large (5MB max)' }, 400);
    let bin = '';
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    const b64 = btoa(bin);

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) return json({ error: 'OCR not configured' }, 500);
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: media, data: b64 } },
            { type: 'text', text: `This is a contractor's purchase receipt. Reply with ONLY a JSON object: {"vendor": string, "total": number (grand total incl. tax), "date": "YYYY-MM-DD" or null, "category": one of ${JSON.stringify(CATS)} (lumber/supplies/hardware = materials, tool/equipment rental or fuel = equipment_other), "summary": short description of items (max 80 chars)}. If unreadable, use null values.` },
          ],
        }],
      }),
    });
    if (!res.ok) { console.error('OCR failed', await res.text()); return json({ error: 'Could not read receipt' }, 502); }
    const data = await res.json();
    const text = (data.content?.[0]?.text || '').trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    let parsed: any = {};
    try { parsed = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)); } catch { /* fall through */ }
    const amount = Number(parsed.total);
    return json({
      vendor: typeof parsed.vendor === 'string' ? parsed.vendor.slice(0, 120) : '',
      amount: Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : null,
      date: /^\d{4}-\d{2}-\d{2}$/.test(parsed.date || '') ? parsed.date : null,
      category: CATS.includes(parsed.category) ? parsed.category : 'materials',
      note: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 120) : '',
    });
  } catch (e) {
    console.error(e);
    return json({ error: 'Server error' }, 500);
  }
});
