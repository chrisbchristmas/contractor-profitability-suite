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

// shortcut: per-isolate memory, best effort; upgrade to a DB-backed counter if abuse is seen.
const hits = new Map<string, number[]>();
export function rateLimited(req: Request, key: string, max = 10, windowMs = 15 * 60 * 1000): boolean {
  const ip = (req.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim();
  const k = `${ip}|${key}`;
  const now = Date.now();
  const recent = (hits.get(k) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(k, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > max;
}

export const tooMany = (headers: HeadersInit) =>
  Response.json({ error: 'Too many attempts. Please try again later.' }, { status: 429, headers });
