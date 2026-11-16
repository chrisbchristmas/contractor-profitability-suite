import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useCustomerAuth } from "@/lib/CustomerAuthContext";
import { isPro } from "@/lib/plans";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

const call = async (fn, body) => {
  const { data } = await base44.functions.invoke(fn, { ...body, session_token: localStorage.getItem("cps_session_token") })
    .catch(async (err) => ({ data: (await err?.context?.json?.().catch(() => null)) || { error: err.message } }));
  if (data?.error) throw new Error(data.error);
  return data;
};

const Upgrade = () => (
  <p className="text-sm text-slate-500">Pro feature. <Link to="/Billing" className="text-blue-600 hover:underline">Upgrade to Pro</Link></p>
);

// Settings cards for Pro features: Stripe Connect (online payments) and crew logins.
export default function ProSettings() {
  const { customer } = useCustomerAuth();
  const pro = isPro(customer);
  return (
    <>
      <PaymentsCard pro={pro} />
      <CrewCard pro={pro} />
    </>
  );
}

function PaymentsCard({ pro }) {
  const { refreshCustomer } = useCustomerAuth();
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pro) return;
    call("stripeConnect", { action: "status" }).then((s) => { setStatus(s); refreshCustomer(); }).catch(() => setStatus({ connected: false }));
  }, [pro]);

  const start = async () => {
    setBusy(true);
    try { window.location.href = (await call("stripeConnect", { action: "start" })).url; }
    catch (e) { toast.error(e.message); setBusy(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Online Payments</CardTitle>
        <CardDescription>Clients pay invoices and change-order deposits by card or ACH, straight into your own Stripe account.</CardDescription>
      </CardHeader>
      <CardContent>
        {!pro ? <Upgrade /> : status?.charges_enabled ? (
          <p className="text-sm font-medium text-emerald-700">Stripe connected — you can send pay links from Invoices.</p>
        ) : (
          <div className="space-y-2">
            {status?.connected && <p className="text-sm text-amber-700">Stripe setup isn't finished yet.</p>}
            <Button onClick={start} disabled={busy || !status} className="bg-blue-600 hover:bg-blue-700">
              {busy ? "Opening Stripe..." : status?.connected ? "Finish Stripe setup" : "Connect Stripe"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CrewCard({ pro }) {
  const [crew, setCrew] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", labor_rate: "" });
  const [busy, setBusy] = useState(false);
  const load = () => call("crewMember", { action: "list" }).then((d) => setCrew(d.crew)).catch(() => {});
  useEffect(() => { if (pro) load(); }, [pro]);

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await call("crewMember", { action: "add", ...form });
      toast.success(`Login created — send ${form.email} the link ${window.location.origin}/crew and their password`);
      setForm({ name: "", email: "", password: "", labor_rate: "" });
      load();
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  const remove = async (m) => {
    if (!window.confirm(`Remove ${m.name}'s login? Their logged hours stay on your jobs.`)) return;
    try { await call("crewMember", { action: "remove", id: m.id }); load(); } catch (err) { toast.error(err.message); }
  };

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Crew Logins</CardTitle>
        <CardDescription>Field techs clock in with GPS and add photos at {window.location.host}/crew. They never see prices or margins.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!pro ? <Upgrade /> : (
          <>
            {crew.length > 0 && (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {crew.map((m) => (
                  <li key={m.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span><span className="font-medium">{m.name}</span> <span className="text-slate-500">{m.email}{m.labor_rate != null ? ` · $${m.labor_rate}/hr` : ""}</span></span>
                    <Button variant="ghost" size="sm" onClick={() => remove(m)} aria-label={`Remove ${m.name}`}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={add} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input placeholder="Name" aria-label="Crew name" value={form.name} onChange={set("name")} required />
              <Input type="email" placeholder="Email" aria-label="Crew email" value={form.email} onChange={set("email")} required />
              <Input type="password" placeholder="Password (8+ characters)" aria-label="Crew password" minLength={8} value={form.password} onChange={set("password")} required />
              <Input type="number" step="0.01" min="0" placeholder="Hourly cost (optional)" aria-label="Hourly cost" value={form.labor_rate} onChange={set("labor_rate")} />
              <Button type="submit" disabled={busy} className="sm:col-span-2 bg-blue-600 hover:bg-blue-700">{busy ? "Creating..." : "Add crew login"}</Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
