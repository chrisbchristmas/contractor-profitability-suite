import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { CheckCircle, Briefcase, FileText, Clock } from "lucide-react";

export default function ShareJobSummary() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    base44.functions.invoke("getJobByShareToken", { token })
      .then((res) => {
        if (res?.data) setData(res.data);
        else setData(res);
      })
      .catch((err) => {
        setError(err?.response?.data?.error || err?.message || "Job not found");
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center max-w-md">
          <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-slate-700 mb-2">Job Not Found</h1>
          <p className="text-sm text-slate-500">{error}</p>
          <p className="text-xs text-slate-400 mt-4">This link may have expired or been revoked.</p>
        </div>
      </div>
    );
  }

  const { job, change_orders = [], total_with_cos } = data;
  const statusLabel = job.status === "completed" ? "Complete" : job.status === "active" ? "In Progress" : job.status;
  const StatusIcon = job.status === "completed" ? CheckCircle : Clock;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Professional Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">CO</span>
            </div>
            <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">Contractor Profitability Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">{job.job_name}</h1>
          {job.client_name && <p className="text-sm text-slate-300 mt-1">{job.client_name}</p>}
          <div className="flex items-center gap-2 mt-3">
            <StatusIcon className="h-4 w-4 text-slate-300" />
            <span className="text-sm font-medium text-slate-200">{statusLabel}</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Contract Value */}
        {job.show_contract_value && job.contract_value != null && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contract Value</h2>
            <p className="text-3xl font-bold text-slate-900">{fmtMoney(job.contract_value)}</p>
            {total_with_cos != null && total_with_cos !== job.contract_value && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Including Approved Change Orders</p>
                <p className="text-2xl font-bold text-blue-700">{fmtMoney(total_with_cos)}</p>
              </div>
            )}
          </div>
        )}

        {/* Change Orders */}
        {job.show_co_details && change_orders.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Approved Change Orders ({change_orders.length})
            </h2>
            <div className="space-y-3">
              {change_orders.map((co, i) => (
                <div key={i} className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="flex items-start gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-700">{co.description || "—"}</p>
                  </div>
                  {co.final_price_to_client != null && (
                    <p className="text-sm font-semibold text-slate-900 shrink-0">{fmtMoney(co.final_price_to_client)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Client Notes */}
        {job.client_notes && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Notes from Your Contractor</h2>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{job.client_notes}</p>
          </div>
        )}

        {/* No visible content */}
        {!job.show_contract_value && !job.show_co_details && !job.client_notes && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500">Your contractor has not shared any details yet.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-3xl mx-auto px-6 pb-8">
        <div className="border-t border-slate-200 pt-4 text-center">
          <p className="text-xs text-slate-400">Powered by Contractor Profitability Suite</p>
        </div>
      </div>
    </div>
  );
}

function fmtMoney(n) {
  return `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}