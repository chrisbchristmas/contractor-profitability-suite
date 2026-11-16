# Feature build (user: "add all of these except the quickbooks sync") — Nov 15 2026
Also: "make sure the premium features are listed in and added to the PRO package" -> src/lib/plans.js (SOLO/PRO lists, isPro), ProGate in SubscriptionGate.jsx, server hasPro() in _shared/owner.ts.
Status: [ ] todo [x] done [b] backend only [~] skipped. NOTHING deployed; supabase_07_features.sql NOT run on prod.

1. [x] Crew logins (Pro): crewMember fn, Settings CrewCard, /crew CrewClock page (GPS clock-in/out)
2. [x] PWA: manifest + iOS meta + GPS clock-in. Service worker [~] skipped (stale-cache risk)
3. [x] Online payments (Pro): stripeConnect, payInvoice, CO deposit, /invoice-paid. Connect button (ProSettings) + Pay link (Invoices) done
4. [~] QuickBooks sync — EXCLUDED by user
5. [x] Receipt capture (Pro): extractReceipt + JobExpenses snap button
6. [x] Estimate -> job one click
7. [x] CSV import + sample job
8. [x] CO text link via free sms: URI (ChangeOrderCard). No Twilio (costs money)
9. [x] Weekly digest (Pro): weeklyDigest fn + Settings toggle. TODO cron at deploy
10. [x] Progress billing + retainage
11. [~] Cost codes variance — existing JobVariance covers est vs actual by category
12. [~] Lien waivers — already built
13. [x] Material price lists (Settings PriceList + expense picker)

Deploy: SQL via `npx supabase db query --linked --yes` (token ~/Desktop/keys.txt SUPABASE_ACCESS_TOKEN), needs user consent for prod writes.
Functions: supabase/deploy.sh. Frontend: git push -> Render autodeploy.
