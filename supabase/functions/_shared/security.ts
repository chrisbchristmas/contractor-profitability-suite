import { supa } from './base44compat.ts';
// Session tokens carry their issue time (base36) so expiry needs no schema change. Old-format tokens count as expired.
const SESSION_TTL_MS = 30 * 24 * 3600 * 1000;

export function newSessionToken(): string {
  return crypto.randomUUID() + '-' + crypto.randomUUID() + '.' + Date.now().toString(36);
}

export function sessionFresh(token: unknown): boolean {
  if (typeof token !== 'string') return false;
  const issued = parseInt(token.split('.')[1] ?? '', 36);
  return Number.isFinite(issued) && Date.now() - issued < SESSION_TTL_MS;
}

// Server-side paywall check: active/trialing subscription or an unexpired trial. Missing trial date = no access.
export function hasAccess(c: any): boolean {
  if (['active', 'trialing'].includes(c?.subscription_status)) return true;
  return !!c?.trial_ends_at && new Date(c.trial_ends_at).getTime() > Date.now();
}

// Two layers: a per-isolate fast path, then a DB-backed counter (public.rate_check) shared across isolates.
// Fails open if the DB call errors so an outage never locks everyone out.
const hits = new Map<string, number[]>();
export async function rateLimited(req: Request, key: string, max = 10, windowMs = 15 * 60 * 1000): Promise<boolean> {
  const ip = (req.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim();
  const k = `${ip}|${key}`;
  const now = Date.now();
  const recent = (hits.get(k) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(k, recent);
  if (hits.size > 5000) hits.clear();
  if (recent.length > max) return true;
  try {
    const { data, error } = await supa.rpc('rate_check', { p_key: k, p_max: max, p_window_secs: Math.ceil(windowMs / 1000) });
    if (error) { console.warn('rate_check failed', error.message); return false; }
    return data === true;
  } catch (e) {
    console.warn('rate_check threw', (e as Error).message);
    return false;
  }
}

export const tooMany = (headers: HeadersInit) =>
  Response.json({ error: 'Too many attempts. Please try again later.' }, { status: 429, headers });
