import React, { useState } from "react";
import { Mail, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/api/supabaseClient";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TRADES = ["HVAC", "Electrical", "Plumbing", "Roofing", "Remodeling", "Painting", "General Contractor", "Other"];

export default function LeadCapture({ source, calcInputs, calcResult, getCalcData }) {
  const storageKey = `lead_email_${source}`;
  const [email, setEmail] = useState("");
  const [trade, setTrade] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(() => localStorage.getItem(storageKey) || "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setSending(true);
    try {
      let inputs = calcInputs || {};
      let result = calcResult || {};
      if (typeof getCalcData === "function") {
        const data = getCalcData() || {};
        inputs = data.inputs || inputs;
        result = data.result || result;
      }
      // shortcut: anon insert can't .select() the row back (lead_read policy is admin-only,
      // and base44Client's generic .create() always appends .select().single(), which makes
      // Postgres re-check SELECT and fail the whole insert) — bypass the shim here and insert
      // without select(). Upgrade: scope lead_read to allow select-after-insert for anon.
      const { error: leadErr } = await supabase.from("lead").insert({
        email,
        name: "",
        source,
        trade,
        calc_inputs: inputs,
        calc_result: result,
        status: "new",
        converted: false,
      });
      if (leadErr) throw leadErr;
      await base44.functions.invoke("sendLeadWelcome", {
        email,
        trade,
        source,
        calc_inputs: inputs,
        calc_result: result,
      });
      localStorage.setItem(storageKey, email);
      setDone("Sent. Check your inbox.");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
    setSending(false);
  };

  return (
    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="w-5 h-5 text-blue-700" />
        <h3 className="font-semibold text-gray-900 text-sm">
          Email me this breakdown + the 5 margin leaks most contractors miss
        </h3>
      </div>
      {done ? (
        <p className="text-sm font-medium text-emerald-700 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {done.startsWith("Sent") ? done : `Breakdown sent to ${done}`}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <select
            value={trade}
            onChange={(e) => setTrade(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
          >
            <option value="">Select your trade (optional)</option>
            {TRADES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={sending}
            className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {sending ? "Sending..." : "Send my breakdown"}
          </button>
        </form>
      )}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}