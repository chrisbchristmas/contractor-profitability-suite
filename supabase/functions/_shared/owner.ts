// Resolve the signed-in contractor (owner) from the Supabase JWT + CPS session token, the same
// two checks updateCustomerSettings does. Returns null when either is missing or they disagree.
import { entities, authMe } from './base44compat.ts';
import { sessionFresh, hasAccess } from './security.ts';

export async function getOwner(req: Request, session_token: unknown) {
  const user = await authMe(req);
  if (!user || typeof session_token !== 'string' || !sessionFresh(session_token)) return null;
  const [customer] = await entities.Customer.filter({ session_token });
  if (!customer || customer.session_token !== session_token) return null;
  if ((customer.email || '').toLowerCase() !== (user.email || '').toLowerCase()) return null;
  return { user, customer };
}

// Pro features: open during the trial, then Pro plan only.
export function hasPro(c: any): boolean {
  if (!hasAccess(c)) return false;
  if (c.subscription_status === 'active') return c.subscription_plan === 'pro';
  return true;
}

export const SITE = 'https://contractorprofitabilitysuite.com';
