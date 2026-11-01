import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Copy, RotateCcw, Check } from "lucide-react";
import { toast } from "sonner";
import ProposalOutput from "./ProposalOutput";

const statusConfig = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-600" },
  sent: { label: "Sent", className: "bg-blue-100 text-blue-700" },
  accepted: { label: "Accepted", className: "bg-green-100 text-green-700" },
  declined: { label: "Declined", className: "bg-red-100 text-red-700" },
};

const fmt = (n) => n != null ? `$${Number(n).toLocaleString()}` : "—";

export default function ProposalDetail({ proposal, onBack, onRegenerate }) {
  const [status, setStatus] = useState(proposal.status || "draft");
  const [copied, setCopied] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    await base44.entities.Proposal.update(proposal.id, { status: newStatus });
    toast.success("Status updated");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(proposal.proposal_content || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  const cfg = statusConfig[status] || statusConfig.draft;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Proposals
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{proposal.client_name}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{proposal.job_type} · {fmt(proposal.contract_value)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Meta info */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Client", value: proposal.client_name },
          { label: "Job Type", value: proposal.job_type },
          { label: "Contract Value", value: fmt(proposal.contract_value) },
          { label: "Created", value: new Date(proposal.created_date).toLocaleDateString() },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Proposal content */}
      {proposal.proposal_content ? (
        <ProposalOutput content={proposal.proposal_content} />
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-10 text-center text-slate-400">
          No proposal content. Click Regenerate to create one.
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 flex-wrap mt-6">
        <Button onClick={handleCopy} variant="outline" className="gap-2">
          {copied ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy Text</>}
        </Button>
        <Button onClick={() => onRegenerate(proposal)} variant="outline" className="gap-2">
          <RotateCcw className="h-4 w-4" /> Regenerate
        </Button>
      </div>
    </div>
  );
}