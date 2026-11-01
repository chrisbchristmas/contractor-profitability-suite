import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, FileText, Copy, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const statusConfig = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-600" },
  sent: { label: "Sent", className: "bg-blue-100 text-blue-700" },
  accepted: { label: "Accepted", className: "bg-green-100 text-green-700" },
  declined: { label: "Declined", className: "bg-red-100 text-red-700" },
};

const fmt = (n) => n != null ? `$${Number(n).toLocaleString()}` : "—";

export default function ProposalList({ proposals, monthlyCount, user, onNew, onView, onRefetch }) {
  const isTrial = user?.subscription_status === "trial";

  const handleCopy = (proposal) => {
    navigator.clipboard.writeText(proposal.proposal_content || "");
    toast.success("Proposal copied to clipboard");
  };

  const handleMarkSent = async (proposal) => {
    await base44.entities.Proposal.update(proposal.id, { status: "sent" });
    toast.success("Marked as sent");
    onRefetch();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Proposal Generator</h1>
          <p className="text-sm text-slate-500 mt-1">Generate professional proposals in seconds</p>
        </div>
        <Button onClick={onNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-1.5" /> New Proposal
        </Button>
      </div>

      {isTrial && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800">
            You have used <strong>{monthlyCount} of 3</strong> free proposals this month.
            Upgrade to Pro for unlimited proposals.
          </p>
          <Link to="/Billing">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white whitespace-nowrap">Upgrade to Pro</Button>
          </Link>
        </div>
      )}

      {proposals.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-14 text-center">
          <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No proposals yet</p>
          <p className="text-slate-400 text-sm mt-1">Generate your first one free.</p>
          <Button onClick={onNew} className="mt-4 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-1.5" /> Generate First Proposal
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 uppercase tracking-wide">Client</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 uppercase tracking-wide hidden sm:table-cell">Job Type</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 uppercase tracking-wide hidden md:table-cell">Value</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 uppercase tracking-wide">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 uppercase tracking-wide hidden lg:table-cell">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {proposals.map((p) => {
                const cfg = statusConfig[p.status] || statusConfig.draft;
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 text-sm">{p.client_name}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-sm text-slate-600">{p.job_type}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-slate-600">{fmt(p.contract_value)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-sm text-slate-400">{new Date(p.created_date).toLocaleDateString()}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => onView(p)} className="text-xs">View</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleCopy(p)} className="text-xs hidden sm:inline-flex">
                          <Copy className="h-3 w-3" />
                        </Button>
                        {p.status === "draft" && (
                          <Button size="sm" variant="ghost" onClick={() => handleMarkSent(p)} className="text-xs hidden sm:inline-flex">
                            <Send className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}