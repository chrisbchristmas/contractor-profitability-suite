import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Edit, Trash2, Lock, TrendingDown, Minus, TrendingUp, Send, Copy, CheckCircle, Clock, PenLine, Paperclip, XCircle, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { canEditCO, canDeleteCO } from "@/components/auth/permissions";
import PhotoGallery from "./PhotoGallery";
import JobAttachments from "@/components/jobs/JobAttachments";

function getMarginStatus(trueMargin, targetMargin) {
  if (trueMargin < targetMargin) return "UNDERPRICED";
  if (trueMargin < targetMargin + 3) return "AT RISK";
  return "SAFE";
}

const marginStatusConfig = {
  UNDERPRICED: { label: "UNDERPRICED", className: "bg-red-100 text-red-700 border-red-200", icon: TrendingDown },
  "AT RISK": { label: "AT RISK", className: "bg-amber-100 text-amber-700 border-amber-200", icon: Minus },
  SAFE: { label: "SAFE", className: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: TrendingUp },
};

const statusStyles = {
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  sent: "bg-amber-50 text-amber-700 border-amber-200",
  viewed: "bg-blue-50 text-blue-700 border-blue-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  declined: "bg-red-50 text-red-700 border-red-200",
};

const $ = (n) => `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

export default function ChangeOrderCard({ co, targetMargin, currentUser, showFinancials, onEdit, onDelete, onSendForApproval, onDeletePhoto, projectedMarginDrop, job }) {
  const [copied, setCopied] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const target = targetMargin || 30;
  const trueMargin = co.true_margin_percent || 0;
  const marginStatus = getMarginStatus(trueMargin, target);
  const marginCfg = marginStatusConfig[marginStatus];
  const MarginIcon = marginCfg.icon;
  const editable = canEditCO(currentUser, co);
  const deletable = canDeleteCO(currentUser);

  const hasClientSignature = !!co.signer_name;

  const handleCopyLink = async (e) => {
    e.stopPropagation();
    if (!co.approval_token) return;
    const url = `${window.location.origin}/ApproveChangeOrder?token=${co.approval_token}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyMessage = async (e) => {
    e.stopPropagation();
    if (!co.approval_token) return;
    const url = `${window.location.origin}/ApproveChangeOrder?token=${co.approval_token}`;
    const client = job?.client_name || co.client_name || "client";
    const jobName = job?.job_name || "your project";
    const desc = co.description ? ` (${co.description})` : "";
    const msg = `Hi ${client}, please review and approve change order${desc} for ${jobName}: ${url}`;
    try {
      await navigator.clipboard.writeText(msg);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = msg;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2500);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h4 className="font-medium text-slate-900 truncate">{co.description}</h4>
          <Badge variant="outline" className={cn("text-xs shrink-0", statusStyles[co.status])}>
            {co.status}
          </Badge>
          {co.base_hourly_wage > 0 && (
            <Badge variant="outline" className="text-xs shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200">
              Burden Included
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 ml-3 shrink-0">
          {editable ? (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(co)}>
              <Edit className="h-3.5 w-3.5 text-slate-400" />
            </Button>
          ) : (
            <div className="h-8 w-8 flex items-center justify-center" title="No edit permission">
              <Lock className="h-3.5 w-3.5 text-slate-300" />
            </div>
          )}
          {deletable && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(co)}>
              <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" />
            </Button>
          )}
        </div>
      </div>

      {/* Client Approval Status Banner */}
      {(co.status === "sent" || co.status === "viewed") && !hasClientSignature && (
        <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border mb-3 text-xs", co.status === "viewed" ? "border-blue-200 bg-blue-50" : "border-amber-200 bg-amber-50")}>
          <Clock className={cn("h-3.5 w-3.5 shrink-0", co.status === "viewed" ? "text-blue-500" : "text-amber-500")} />
          <span className={cn("font-medium", co.status === "viewed" ? "text-blue-700" : "text-amber-700")}>
            {co.status === "viewed" ? "Opened by client — awaiting approval" : "Pending Client Approval"}
          </span>
          {co.approval_token && (
            <div className="flex items-center gap-1 ml-auto">
              <Button variant="ghost" size="sm" className={cn("h-6 px-2 text-xs", co.status === "viewed" ? "text-blue-700 hover:bg-blue-100" : "text-amber-700 hover:bg-amber-100")} onClick={handleCopyLink}>
                {copied ? <><CheckCircle className="h-3 w-3 mr-1" /> Copied!</> : <><Copy className="h-3 w-3 mr-1" /> Copy Link</>}
              </Button>
              <Button variant="ghost" size="sm" className={cn("h-6 px-2 text-xs", co.status === "viewed" ? "text-blue-700 hover:bg-blue-100" : "text-amber-700 hover:bg-amber-100")} onClick={handleCopyMessage}>
                {copiedMsg ? <><CheckCircle className="h-3 w-3 mr-1" /> Copied!</> : <><Copy className="h-3 w-3 mr-1" /> Copy Message</>}
              </Button>
            </div>
          )}
        </div>
      )}
      {co.status === "approved" && hasClientSignature && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 mb-3 text-xs">
          <PenLine className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span className="font-medium text-emerald-700">
            Client-signed by {co.signer_name}
            {co.signed_at && (
              <span className="font-normal text-emerald-600"> on {new Date(co.signed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            )}
          </span>
          {co.approval_token && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 ml-auto text-xs text-emerald-700 hover:bg-emerald-100"
              onClick={handleCopyLink}
            >
              {copied ? <><CheckCircle className="h-3 w-3 mr-1" /> Copied!</> : <><Copy className="h-3 w-3 mr-1" /> Copy Link</>}
            </Button>
          )}
        </div>
      )}
      {co.status === "approved" && !hasClientSignature && co.approved_by_name && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 mb-3 text-xs">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span className="font-medium text-emerald-700">Approved internally by {co.approved_by_name}</span>
        </div>
      )}
      {co.status === "declined" && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 mb-3 text-xs">
          <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="font-medium text-red-700">Declined by client</span>
            {co.declined_at && (
              <span className="font-normal text-red-600"> on {new Date(co.declined_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            )}
            {co.decline_reason && (
              <p className="text-red-600 mt-0.5 break-words">"{co.decline_reason}"</p>
            )}
          </div>
          {co.approval_token && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-red-700 hover:bg-red-100 shrink-0" onClick={handleCopyLink}>
              {copied ? <><CheckCircle className="h-3 w-3 mr-1" /> Copied!</> : <><Copy className="h-3 w-3 mr-1" /> Copy Link</>}
            </Button>
          )}
        </div>
      )}

      {/* Send for Approval action (draft only) */}
      {co.status === "draft" && onSendForApproval && (
        <div className="flex items-center gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7 border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={() => onSendForApproval(co)}
          >
            <Send className="h-3 w-3 mr-1.5" /> Send for Client Approval
          </Button>
        </div>
      )}

      {/* If sent/approved with token but no button shown above, still show copy link */}
      {co.status !== "draft" && co.approval_token && !hasClientSignature && co.status === "approved" && !co.approved_by_name && (
        <div className="flex items-center gap-2 mb-3">
          <Button variant="ghost" size="sm" className="text-xs h-7 text-slate-500" onClick={handleCopyLink}>
            {copied ? <><CheckCircle className="h-3 w-3 mr-1" /> Copied!</> : <><Copy className="h-3 w-3 mr-1" /> Copy Approval Link</>}
          </Button>
        </div>
      )}

      {/* Margin Status Banner */}
      {showFinancials && co.total_cost > 0 && (
        <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border mb-3 text-xs font-semibold", marginCfg.className)}>
          <MarginIcon className="h-3.5 w-3.5" />
          <span>{marginCfg.label}</span>
          {marginStatus === "UNDERPRICED" && co.leakage_amount > 0 && (
            <span className="ml-1 font-normal">— leaving {$(co.leakage_amount)} on the table</span>
          )}
          {marginStatus !== "UNDERPRICED" && (
            <span className="ml-1 font-normal">— {trueMargin.toFixed(1)}% margin</span>
          )}
        </div>
      )}

      {/* Projected margin drop warning */}
      {showFinancials && projectedMarginDrop !== undefined && projectedMarginDrop !== null && projectedMarginDrop > 0.1 && co.status !== "approved" && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-orange-200 bg-orange-50 mb-3 text-xs text-orange-700">
          <TrendingDown className="h-3.5 w-3.5 shrink-0" />
          <span>Approving this lowers job margin by <strong>{projectedMarginDrop.toFixed(1)}%</strong></span>
        </div>
      )}

      {co.photos?.length > 0 && (
        <div className="mb-3">
          <PhotoGallery
            photos={co.photos}
            canDelete={editable && !!onDeletePhoto}
            onDelete={(idx) => onDeletePhoto(co, idx)}
          />
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div>
          <p className="text-xs text-slate-400">Total Cost</p>
          <p className="text-sm font-semibold text-slate-900">
            {showFinancials ? $(co.total_cost) : "••••"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Sell Price</p>
          <p className="text-sm font-semibold text-blue-600">
            {showFinancials ? $(co.sell_price) : "••••"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Client Price</p>
          <p className="text-sm font-semibold text-slate-900">
            {$(co.final_price_to_client || co.sell_price)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Margin</p>
          {showFinancials ? (
            <p className={cn("text-sm font-semibold",
              marginStatus === "SAFE" ? "text-emerald-600" :
              marginStatus === "AT RISK" ? "text-amber-600" : "text-red-600"
            )}>
              {trueMargin.toFixed(1)}%
            </p>
          ) : (
            <p className="text-sm font-semibold text-slate-300">••••</p>
          )}
        </div>
        <div>
          <p className="text-xs text-slate-400">Leakage</p>
          {showFinancials ? (
            <div className="flex items-center gap-1">
              {co.leakage_amount > 0 && <AlertTriangle className="h-3 w-3 text-red-500" />}
              <p className={cn("text-sm font-semibold", co.leakage_amount > 0 ? "text-red-600" : "text-slate-400")}>
                {co.leakage_amount > 0 ? $(co.leakage_amount) : "—"}
              </p>
            </div>
          ) : (
            <p className="text-sm font-semibold text-slate-300">••••</p>
          )}
        </div>
      </div>

      {/* CO Attachments toggle */}
      <div className="mt-3 pt-3 border-t border-slate-100">
        <button
          onClick={() => setShowAttachments(s => !s)}
          className="text-xs font-medium text-slate-500 hover:text-blue-600 flex items-center gap-1"
        >
          <Paperclip className="h-3 w-3" />
          {showAttachments ? "Hide" : "Show"} Attachments
        </button>
        {showAttachments && (
          <div className="mt-3">
            <JobAttachments jobId={co.job_id} changeOrderId={co.id} />
          </div>
        )}
      </div>

      {/* Audit Trail Timeline */}
      <div className="mt-3 pt-3 border-t border-slate-100">
        <button
          onClick={() => setShowTimeline(s => !s)}
          className="text-xs font-medium text-slate-500 hover:text-blue-600 flex items-center gap-1"
        >
          <History className="h-3 w-3" />
          {showTimeline ? "Hide" : "Show"} Audit Trail
        </button>
        {showTimeline && <AuditTimeline co={co} />}
      </div>
    </div>
  );
}

function AuditTimeline({ co }) {
  const fmt = (iso) => iso
    ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
    : null;
  const steps = [
    { key: "draft", label: "Draft created", ts: co.created_date, done: true, tone: "slate" },
    { key: "sent", label: "Approval link sent", ts: null, done: ["sent", "viewed", "approved", "declined"].includes(co.status), tone: "amber" },
    { key: "viewed", label: "Opened by client", ts: co.viewed_at, done: !!co.viewed_at, tone: "blue" },
    co.status === "declined"
      ? { key: "declined", label: "Declined by client", ts: co.declined_at, done: true, tone: "red", meta: co.decline_reason, signer: co.signer_name }
      : { key: "approved", label: "Approved & signed", ts: co.signed_at || co.approved_at, done: co.status === "approved", tone: "emerald", signer: co.signer_name || co.approved_by_name },
  ];
  const dot = { slate: "bg-slate-300", amber: "bg-amber-400", blue: "bg-blue-400", emerald: "bg-emerald-500", red: "bg-red-500" };
  return (
    <ol className="mt-3">
      {steps.map((s, i) => (
        <li key={s.key} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className={cn("w-2.5 h-2.5 rounded-full", s.done ? dot[s.tone] : "bg-slate-200")} />
            {i < steps.length - 1 && <span className="w-px flex-1 bg-slate-200 my-0.5" />}
          </div>
          <div className="pb-3 -mt-0.5">
            <p className={cn("text-xs font-medium", s.done ? "text-slate-700" : "text-slate-400")}>{s.label}</p>
            {s.ts && <p className="text-xs text-slate-400">{fmt(s.ts)}</p>}
            {s.signer && <p className="text-xs text-slate-500">by {s.signer}</p>}
            {s.meta && <p className="text-xs text-slate-500 break-words">&ldquo;{s.meta}&rdquo;</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}