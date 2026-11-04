// NOTE: Requires ANTHROPIC_API_KEY as a Supabase Edge Function secret.
import { entities } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const { session_token, form } = body;

    if (!session_token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const customers = await entities.Customer.filter({ session_token });
    if (!customers || customers.length === 0) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }
    const customer = customers[0];
    if (customer.session_token !== session_token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500, headers: corsHeaders });
    }

    const toneLabel = form.tone || 'professional';
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const userMessage = `Write a ${toneLabel} contractor proposal with the following details:
Contractor: ${form.contractor_company || 'N/A'}, License: ${form.contractor_license || 'N/A'}, Phone: ${form.contractor_phone || 'N/A'}, Email: ${form.contractor_email || 'N/A'}
Client: ${form.client_name}, ${form.client_email || ''}, ${form.client_address || ''}
Job Type: ${form.job_type}
Scope of Work: ${form.scope_description}
Contract Value: $${Number(form.contract_value).toLocaleString()}
Timeline: ${form.timeline || 'To be determined'}
Payment Terms: ${form.payment_terms || '50% deposit required to schedule, 50% due on completion'}
Warranty: ${form.warranty_terms || '1-year labor warranty on all work performed'}
Special Notes: ${form.special_notes || 'None'}
Today's Date: ${today}

Structure the proposal with these sections:
1. Header with contractor and client info and today's date
2. Project Overview
3. Detailed Scope of Work
4. Project Timeline
5. Investment (price breakdown)
6. Payment Terms
7. Warranty & Guarantee
8. Why Choose Us (2-3 sentences about professionalism and quality)
9. Acceptance line with signature space
Keep it professional, clear, and ready to send to a client. Use plain text formatting with clear section headers.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: 'You are an expert proposal writer for contractors and tradespeople. Write professional, persuasive, and clear project proposals that help contractors win jobs. Use plain language. Never use jargon a homeowner or business owner wouldn\'t understand. Structure proposals clearly with sections. Make the contractor sound trustworthy, organized, and skilled.',
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return Response.json({ error: 'Claude API error: ' + err }, { status: 500, headers: corsHeaders });
    }

    const data = await response.json();
    const proposalText = data.content?.[0]?.text || '';

    return Response.json({ proposal_content: proposalText }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
