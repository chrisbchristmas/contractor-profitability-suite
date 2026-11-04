import { supabase } from './supabaseClient';

// Drop-in replacement for the @base44/sdk client. Every call site in this app
// talks to `base44.entities.X`, `base44.auth.*`, `base44.functions.invoke`,
// and `base44.integrations.Core.UploadFile` — this shim keeps that exact
// surface so none of the 50 importing files needed to change.

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

// "-created_date" => order by created_date desc; "date" => order by date asc
function applySort(query, sort) {
  if (!sort) return query;
  const desc = sort.startsWith('-');
  const col = desc ? sort.slice(1) : sort;
  return query.order(col, { ascending: !desc });
}

function throwIfError({ data, error }) {
  if (error) throw new Error(error.message || JSON.stringify(error));
  return data;
}

function makeEntity(name) {
  const table = TABLES[name];
  if (!table) throw new Error(`Unknown entity: ${name}`);

  return {
    list: async (sort, limit) => {
      let q = supabase.from(table).select('*');
      q = applySort(q, sort);
      if (limit) q = q.limit(limit);
      return throwIfError(await q);
    },
    filter: async (match, sort, limit) => {
      let q = supabase.from(table).select('*').match(match || {});
      q = applySort(q, sort);
      if (limit) q = q.limit(limit);
      return throwIfError(await q);
    },
    get: async (id) => {
      const q = supabase.from(table).select('*').eq('id', id).single();
      return throwIfError(await q);
    },
    create: async (data) => {
      const q = supabase.from(table).insert(data).select().single();
      return throwIfError(await q);
    },
    update: async (id, data) => {
      const q = supabase.from(table).update(data).eq('id', id).select().single();
      return throwIfError(await q);
    },
    delete: async (id) => {
      const q = supabase.from(table).delete().eq('id', id);
      return throwIfError(await q);
    },
    bulkCreate: async (records) => {
      const q = supabase.from(table).insert(records).select();
      return throwIfError(await q);
    },
    bulkUpdate: async (records) => {
      // base44's bulkUpdate takes [{id, ...fields}, ...]; Postgres has no
      // multi-row update-with-different-values in one call, so loop.
      const results = [];
      for (const { id, ...fields } of records) {
        const q = supabase.from(table).update(fields).eq('id', id).select().single();
        results.push(throwIfError(await q));
      }
      return results;
    },
  };
}

const entities = new Proxy({}, { get: (_, name) => makeEntity(name) });

const auth = {
  // Platform (owner/pm/admin) auth — kept for API-surface compatibility.
  // Real app access is gated by CustomerAuthContext + Customer table, not
  // this; every call site swallows a null/rejected result safely.
  me: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user;
  },
  logout: async (redirectTo) => {
    await supabase.auth.signOut();
    if (redirectTo) window.location.href = redirectTo;
  },
  redirectToLogin: (returnUrl) => {
    window.location.href = `/login${returnUrl ? `?redirect=${encodeURIComponent(returnUrl)}` : ''}`;
  },
};

const functions = {
  invoke: async (name, body) => {
    const res = await supabase.functions.invoke(name, { body });
    if (res.error) throw res.error;
    return res; // shape matches base44: { data, error }
  },
};

const integrations = {
  Core: {
    UploadFile: async ({ file }) => {
      const bucket = 'attachments';
      const path = `${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return { file_url: data.publicUrl };
    },
  },
};

export const base44 = {
  entities,
  auth,
  functions,
  integrations,
  asServiceRole: { entities, integrations }, // client never has the service key; same shape, RLS-bound
};
