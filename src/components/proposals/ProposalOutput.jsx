import React from "react";

export default function ProposalOutput({ content }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
      <div className="prose prose-slate max-w-none">
        <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800 leading-relaxed">
          {content}
        </pre>
      </div>
    </div>
  );
}