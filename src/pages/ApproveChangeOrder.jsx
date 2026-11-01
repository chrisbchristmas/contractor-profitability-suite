import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, FileText, Shield, Loader2, AlertCircle, XCircle } from "lucide-react";
import PhotoGallery from "@/components/changeorders/PhotoGallery";

const $ = (n) => `$${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ApproveChangeOrder() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  const [co, setCo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [signerName, setSignerName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError("No approval token provided.");
      setLoading(false);
      return;
    }
    base44.functions
      .invoke("getChangeOrderByToken", { token })
      .then((res) => {
        setCo(res.data);
        if (res.data?.status === "approved" && res.data?.signer_name) {
          setSigned(true);
          setSignerName(res.data.signer_name);
        } else if (res.data?.status === "declined") {
          setDeclined(true);
        }
      })
      .catch((e) => setError(e?.response?.data?.error || e?.message || "Unable to load this change order."))
      .finally(() => setLoading(false));
  }, [token]);

  const handleApprove = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    if (!signerName.trim()) {
      setSubmitError("Please type your full name as your signature.");
      return;
    }
    if (!agreed) {
      setSubmitError("Please check the agreement box to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("approveChangeOrder", {
        token,
        signer_name: signerName,
        agreed,
      });
      if (res.data?.success) {
        setSigned(true);
      } else {
        setSubmitError(res.data?.error || "Something went wrong.");
      }
    } catch (err) {
      setSubmitError(err?.response?.data?.error || err?.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setDeclining(true);
    try {
      const res = await base44.functions.invoke("declineChangeOrder", {
        token,
        decline_reason: declineReason,
      });
      if (res.data?.success) {
        setDeclined(true);
        setShowDeclineForm(false);
      } else {
        setSubmitError(res.data?.error || "Something went wrong.");
      }
    } catch (err) {
      setSubmitError(err?.response?.data?.error || err?.message || "Decline failed.");
    } finally {
      setDeclining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading change order…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-slate-800 mb-2">Unable to Load</h1>
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const b = co?.breakdown || {};

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-600 mb-4">
            <FileText className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Change Order Approval</h1>
          <p className="text-slate-500 text-sm mt-1">Review and approve the change order below</p>
        </div>

        {/* Signed confirmation */}
        {signed ? (
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4">
              <CheckCircle className="h-9 w-9 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Thank You — This Has Been Signed</h2>
            <p className="text-slate-500 text-sm mb-6">
              Your approval has been recorded. The contractor has been notified and will proceed with this change order.
            </p>
            <div className="bg-slate-50 rounded-lg p-4 text-left text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Signed by</span>
                <span className="font-medium text-slate-900">{signerName}</span>
              </div>
              {co?.signed_at && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Date</span>
                  <span className="font-medium text-slate-900">
                    {new Date(co.signed_at).toLocaleString("en-US", {
                      dateStyle: "long",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : declined ? (
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
              <XCircle className="h-9 w-9 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Change Order Declined</h2>
            <p className="text-slate-500 text-sm mb-6">
              Your decision has been recorded. The contractor has been notified.
            </p>
            <div className="bg-slate-50 rounded-lg p-4 text-left text-sm space-y-2">
              {co?.declined_at && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Date</span>
                  <span className="font-medium text-slate-900">
                    {new Date(co.declined_at).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}
                  </span>
                </div>
              )}
              {co?.decline_reason && (
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 shrink-0">Reason</span>
                  <span className="font-medium text-slate-900 text-right">{co.decline_reason}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* CO Details Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-medium text-amber-700">
                    Pending Your Approval
                  </span>
                </div>
                {co?.job_name && (
                  <p className="text-sm text-slate-500 mb-1">Project: <span className="font-medium text-slate-700">{co.job_name}</span></p>
                )}
                {co?.client_name && (
                  <p className="text-sm text-slate-500">Client: <span className="font-medium text-slate-700">{co.client_name}</span></p>
                )}
              </div>

              <div className="p-6">
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-2">Description of Work</h3>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap mb-6">{co?.description}</p>

                {co?.photos?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-3">Photos</h3>
                    <PhotoGallery photos={co.photos} />
                  </div>
                )}

                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-3">Price Breakdown</h3>
                <div className="space-y-2">
                  <LineItem label="Labor" value={b.labor} />
                  <LineItem label="Materials" value={b.materials} />
                  {b.equipment > 0 && <LineItem label="Equipment" value={b.equipment} />}
                  {b.subcontractor > 0 && <LineItem label="Subcontractor" value={b.subcontractor} />}
                  <LineItem label="Subtotal" value={b.subtotal} bold />
                  <LineItem label="Overhead" value={b.overhead} />
                  {b.tax > 0 && <LineItem label="Tax" value={b.tax} />}
                </div>
                <div className="mt-4 pt-4 border-t-2 border-slate-300 flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-900">Total Due</span>
                  <span className="text-2xl font-bold text-blue-600">${(b.total || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {co?.payment_due_days != null && (
                  <p className="text-xs text-slate-400 mt-3">
                    Payment due within {co.payment_due_days} days of approval.
                  </p>
                )}
              </div>
            </div>

            {/* E-Signature Form */}
            <form onSubmit={handleApprove} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Approve & Sign</h3>
              <p className="text-sm text-slate-500 mb-5">
                Type your full legal name below to serve as your electronic signature.
              </p>

              <div className="mb-4">
                <Label htmlFor="signature" className="text-sm font-medium text-slate-700">
                  Full Name (E-Signature)
                </Label>
                <Input
                  id="signature"
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Type your full legal name"
                  className="mt-1.5"
                  autoComplete="name"
                  disabled={submitting}
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer mb-5">
                <Checkbox
                  checked={agreed}
                  onCheckedChange={(v) => setAgreed(v === true)}
                  disabled={submitting}
                  className="mt-0.5"
                />
                <span className="text-sm text-slate-600 leading-relaxed">
                  I authorize this change order and agree to the price shown. By typing my name above and checking this box,
                  I am providing my electronic signature to approve this change order.
                </span>
              </label>

              {submitError && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 mb-4">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
                disabled={submitting || !signerName.trim() || !agreed}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" /> Approve & Sign
                  </>
                )}
              </Button>
            </form>

            {/* Decline action */}
            {!showDeclineForm ? (
              <button
                type="button"
                onClick={() => { setSubmitError(null); setShowDeclineForm(true); }}
                className="w-full mt-3 text-sm text-slate-400 hover:text-red-500 transition-colors py-2"
              >
                Decline this change order
              </button>
            ) : (
              <form onSubmit={handleDecline} className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 mt-4">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Decline Change Order</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Optionally tell the contractor why you're declining (they'll be notified).
                </p>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Reason (optional)"
                  rows={3}
                  disabled={declining}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                />
                {submitError && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 mb-4">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <p className="text-sm text-red-700">{submitError}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" disabled={declining}
                    onClick={() => { setShowDeclineForm(false); setDeclineReason(""); setSubmitError(null); }}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="destructive" className="flex-1" disabled={declining}>
                    {declining ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…</> : "Confirm Decline"}
                  </Button>
                </div>
              </form>
            )}

            <div className="flex items-center justify-center gap-1.5 mt-6 text-xs text-slate-400">
              <Shield className="h-3.5 w-3.5" />
              <span>Secure e-signature · Your IP address and timestamp will be recorded</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LineItem({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? "font-semibold text-slate-800" : "text-slate-600"}`}>{label}</span>
      <span className={`text-sm ${bold ? "font-semibold text-slate-800" : "font-medium text-slate-700"}`}>{$(value)}</span>
    </div>
  );
}