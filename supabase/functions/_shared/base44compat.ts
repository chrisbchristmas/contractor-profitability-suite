// Shared Supabase service-role client for Edge Functions.
// Mirrors base44.asServiceRole.entities.X with the minimal surface each
// ported function actually uses (filter/get/create/update/delete/list).
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

export const supa = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
);

const TABLES = {
  AuditLog: 'audit_log',
  COTemplate: 'co_template',
  CalculatorUsage: 'calculator_usage',
  ChangeOrder: 'change_order',
  CostPreset: 'cost_preset',
  CrewCost: 'crew_cost',
  Customer: 'customer',
  DailyLog: 'daily_log',
  Estimate: 'estimate',
  Invoice: 'invoice',
  Job: 'job',
  JobAttachment: 'job_attachment',
  JobExpense: 'job_expense',
  JobTemplate: 'job_template',
  Lead: 'lead',
  LeakageFlag: 'leakage_flag',
  LienWaiver: 'lien_waiver',
  MarginHistory: 'margin_history',
  Notification: 'notification',
  PdfRecord: 'pdf_record',
  Proposal: 'proposal',
  Selection: 'selection',
  SeoArticle: 'seo_article',
  SeoTopic: 'seo_topic',
  SubcontractorPO: 'subcontractor_po',
  Task: 'task',
  TimeEntry: 'time_entry',
  User: 'app_user',
  Warranty: 'warranty',
};

function throwIfError({ data, error }) {
  if (error) throw new Error(error.message || JSON.stringify(error));
  return data;
}

function makeEntity(name) {
  const table = TABLES[name];
  if (!table) throw new Error(`Unknown entity: ${name}`);
  return {
    list: async () => throwIfError(await supa.from(table).select('*')),
    filter: async (match) => throwIfError(await supa.from(table).select('*').match(match || {})),
    get: async (id) => throwIfError(await supa.from(table).select('*').eq('id', id).single()),
    create: async (data) => throwIfError(await supa.from(table).insert(data).select().single()),
    update: async (id, data) => throwIfError(await supa.from(table).update(data).eq('id', id).select().single()),
    delete: async (id) => throwIfError(await supa.from(table).delete().eq('id', id)),
    bulkCreate: async (records) => throwIfError(await supa.from(table).insert(records).select()),
  };
}

// base44.asServiceRole.entities.X equivalent
export const entities = new Proxy({}, { get: (_, name) => makeEntity(name) });

// Resolve the caller's platform user from the request's bearer token
// (replaces base44.auth.me() inside edge functions).
export async function authMe(req) {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await supa.auth.getUser(token);
  if (!user) return null;
  const { data: appUser } = await supa.from('app_user').select('*').eq('id', user.id).single();
  return { ...user, ...appUser };
}

// shortcut: uses SendGrid (existing account) instead of Resend to avoid a new signup; swap back if Resend is ever preferred.
export async function sendEmail({ to, subject, body, text, from_name }) {
  const apiKey = Deno.env.get('SENDGRID_API_KEY');
  if (!apiKey) {
    console.error('SENDGRID_API_KEY not configured — email not sent:', { to, subject });
    return;
  }
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'noreply@contractorprofitabilitysuite.com', name: from_name || 'Contractor Profitability Suite' },
      subject,
      content: [
        ...(text ? [{ type: 'text/plain', value: text }] : []),
        { type: 'text/html', value: body },
      ],
    }),
  });
  if (!res.ok) console.error('sendEmail failed:', await res.text());
}

// base44.integrations.Core.InvokeLLM equivalent — calls Anthropic directly and
// asks it to return JSON matching the given schema (parsed and returned as an object).
// Requires ANTHROPIC_API_KEY as a Supabase Edge Function secret.
export async function invokeLLM({ prompt, response_json_schema }) {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const schemaInstruction = response_json_schema
    ? `\n\nRespond with ONLY a single valid JSON object (no markdown fences, no commentary) matching this JSON schema:\n${JSON.stringify(response_json_schema)}`
    : '';

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt + schemaInstruction }],
    }),
  });

  if (!res.ok) {
    throw new Error('InvokeLLM error: ' + (await res.text()));
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || '';

  if (!response_json_schema) return text;

  // Strip markdown code fences if the model added them anyway
  const cleaned = text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error('InvokeLLM returned non-JSON output: ' + text.slice(0, 500));
  }
}

export function cors(req, body, init = {}) {
  return new Response(body, {
    ...init,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      ...(init.headers || {}),
    },
  });
}
