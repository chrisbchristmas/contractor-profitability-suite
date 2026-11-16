import React, { useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Camera, LogOut, Loader2, MapPin } from "lucide-react";

// Standalone field page for crew logins (created by the owner in Settings → Crew).
// Crew only see job names (crew_jobs RPC). Clock-in lives on the phone; one time entry is written at clock-out,
// because crew rows belong to the owner and crew can't read them back.
const SHIFT_KEY = "cps_crew_shift";

const getPosition = () => new Promise((resolve) => {
  if (!navigator.geolocation) return resolve(null);
  navigator.geolocation.getCurrentPosition(
    (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
    () => resolve(null), // GPS denied/unavailable: still allow clock-in
    { enableHighAccuracy: true, timeout: 10000 },
  );
});

export default function CrewClock() {
  const [session, setSession] = useState(undefined);
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState("");
  const [shift, setShift] = useState(() => JSON.parse(localStorage.getItem(SHIFT_KEY) || "null"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok: boolean, text }
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => { data.subscription.unsubscribe(); clearInterval(t); };
  }, []);

  useEffect(() => {
    if (!session) return;
    supabase.rpc("crew_jobs").then(({ data, error }) => {
      if (error) return setMsg({ ok: false, text: "Couldn't load jobs. Ask your contractor to check your crew login." });
      setJobs(data || []);
      if (data?.length === 1) setJobId(data[0].id);
    });
  }, [session]);

  const run = async (fn) => {
    setBusy(true); setMsg(null);
    try { await fn(); } catch (e) { setMsg({ ok: false, text: e.message || "Something went wrong" }); }
    finally { setBusy(false); }
  };

  const signIn = (e) => {
    e.preventDefault();
    run(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) throw new Error("Wrong email or password");
    });
  };

  const clockIn = () => run(async () => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) throw new Error("Pick a job first");
    const pos = await getPosition();
    const s = { job_id: job.id, job_name: job.job_name, at: new Date().toISOString(), lat: pos?.lat ?? null, lng: pos?.lng ?? null };
    localStorage.setItem(SHIFT_KEY, JSON.stringify(s));
    setShift(s);
    setMsg({ ok: true, text: pos ? "Clocked in — location recorded" : "Clocked in (location unavailable)" });
  });

  const clockOut = () => run(async () => {
    const out = new Date();
    const hours = Math.max(0.01, Math.round(((out - new Date(shift.at)) / 3600000) * 100) / 100);
    // No .select(): crew can insert but not read owner rows. Name/rate are set server-side by trigger.
    const { error } = await supabase.from("time_entry").insert({
      job_id: shift.job_id, date: shift.at.slice(0, 10), hours,
      clock_in_at: shift.at, clock_out_at: out.toISOString(),
      clock_in_lat: shift.lat, clock_in_lng: shift.lng, description: "Field clock-in",
    });
    if (error) throw new Error("Couldn't save your time — you're still clocked in, try again");
    localStorage.removeItem(SHIFT_KEY);
    setShift(null);
    setMsg({ ok: true, text: `Clocked out — ${hours} hours logged` });
  });

  const uploadPhoto = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const target = shift?.job_id || jobId;
    if (!file) return;
    run(async () => {
      if (!target) throw new Error("Pick a job first");
      if (!file.type.startsWith("image/")) throw new Error("Please choose a photo");
      if (file.size > 10 * 1024 * 1024) throw new Error("Photo is too large (10MB max)");
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const { error } = await supabase.from("job_attachment").insert({
        job_id: target, file_name: file.name, file_type: file.type, file_url, category: "photo",
      });
      if (error) throw new Error("Photo uploaded but couldn't be attached to the job");
      setMsg({ ok: true, text: "Photo added to the job" });
    });
  };

  const signOut = async () => { await supabase.auth.signOut(); setJobs([]); };

  const elapsed = shift ? Math.floor((now - new Date(shift.at)) / 60000) : 0;

  return (
    <main className="min-h-screen bg-slate-50 flex items-start justify-center p-4 pt-12">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 w-full max-w-sm">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Clock className="h-5 w-5 text-blue-600" aria-hidden="true" /> Crew Time Clock</h1>

        {session === undefined ? (
          <Loader2 className="h-6 w-6 animate-spin mx-auto my-8 text-slate-400" aria-label="Loading" />
        ) : !session ? (
          <form onSubmit={signIn} className="mt-6 space-y-4">
            <div><Label htmlFor="crew-email">Email</Label><Input id="crew-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" /></div>
            <div><Label htmlFor="crew-pw">Password</Label><Input id="crew-pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1" /></div>
            <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</Button>
            <p className="text-xs text-slate-500 text-center">Your login is created by your contractor.</p>
          </form>
        ) : (
          <div className="mt-6 space-y-4">
            {shift ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                <p className="text-sm text-emerald-800 font-medium">On the clock — {shift.job_name}</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">{Math.floor(elapsed / 60)}h {elapsed % 60}m</p>
                {shift.lat != null && <p className="text-xs text-emerald-700 mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden="true" /> Location recorded</p>}
                <Button onClick={clockOut} disabled={busy} className="w-full h-12 mt-4 bg-red-600 hover:bg-red-700 text-base">Clock out</Button>
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="crew-job">Job</Label>
                  <select id="crew-job" value={jobId} onChange={(e) => setJobId(e.target.value)} className="mt-1 w-full h-11 rounded-md border border-slate-300 bg-white px-3 text-sm">
                    <option value="">{jobs.length ? "Select a job" : "No active jobs"}</option>
                    {jobs.map((j) => <option key={j.id} value={j.id}>{j.job_name}{j.client_name ? ` — ${j.client_name}` : ""}</option>)}
                  </select>
                </div>
                <Button onClick={clockIn} disabled={busy || !jobId} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-base">Clock in</Button>
              </>
            )}

            <label className="flex items-center justify-center gap-2 w-full h-11 rounded-lg border-2 border-dashed border-blue-300 text-sm font-medium text-blue-700 cursor-pointer">
              <Camera className="h-4 w-4" aria-hidden="true" /> Add job photo
              <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={uploadPhoto} disabled={busy} />
            </label>

            <button onClick={signOut} className="w-full text-xs text-slate-500 flex items-center justify-center gap-1 pt-2"><LogOut className="h-3 w-3" aria-hidden="true" /> Sign out</button>
          </div>
        )}

        {msg && <p role="status" className={`mt-4 text-sm text-center ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</p>}
      </div>
    </main>
  );
}
