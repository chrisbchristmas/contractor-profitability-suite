import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, Printer } from "lucide-react";
import { format } from "date-fns";
import { calculateJobMargins } from "@/components/changeorders/CalculationEngine";

export default function JobProfitReport({ job, changeOrders, jobMargins, onClose }) {
  const jobId = job.id;

  const { data: flags = [] } = useQuery({
    queryKey: ["reportFlags", jobId],
    queryFn: async () => {
      const all = [];
      for (const co of changeOrders) {
        const f = await base44.entities.LeakageFlag.filter({ change_order_id: co.id });
        all.push(...f);
      }
      return all;
    },
    enabled: !!jobId,
  });

  const { data: warranties = [] } = useQuery({
    queryKey: ["reportWarranties", jobId],
    queryFn: () => base44.entities.Warranty.filter({ job_id: jobId }),
    enabled: !!jobId,
  });

  const { data: pos = [] } = useQuery({
    queryKey: ["reportPOs", jobId],
    queryFn: () => base44.entities.SubcontractorPO.filter({ job_id: jobId }),
    enabled: !!jobId,
  });

  const now = new Date();
  const contractValue = job.contract_value || 0;
  const totalEstCost = jobMargins?.adjustedCost ?? (job.estimated_cost || 0);
  const grossProfit = jobMargins?.totalJobProfit ?? (contractValue - totalEstCost);
  const marginPct = jobMargins?.realTimeMargin ?? 0;
  const markupPct = totalEstCost > 0 ? ((contractValue - totalEstCost) / totalEstCost) * 100 : 0;
  const targetMargin = job.target_margin_percent ?? 30;

  const paceStatus = marginPct >= targetMargin + 5 ? "Ahead" : marginPct >= targetMargin ? "On Track" : "Behind";
  const paceColor = paceStatus === "Ahead" ? "#059669" : paceStatus === "On Track" ? "#2563eb" : "#dc2626";

  // Labour burden summary — aggregate from COs that have burden data
  const cosWithBurden = changeOrders.filter(co => co.base_hourly_wage);
  const baseWage = cosWithBurden.length > 0 ? cosWithBurden[0].base_hourly_wage : 0;
  const loadedRate = cosWithBurden.length > 0 ? cosWithBurden[0].fully_loaded_rate : 0;
  const totalBurdenCost = changeOrders.reduce((s, co) => s + (co.total_labor_burden_cost || 0), 0);

  const outstandingPOs = pos.filter(p => p.status !== "completed" && p.status !== "disputed");

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-start justify-center overflow-y-auto p-4 print:bg-white print:p-0 print:overflow-visible">
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .report-printable, .report-printable * { visibility: visible !important; }
          .report-printable { position: absolute !important; left: 0; top: 0; width: 100%; max-height: none !important; overflow: visible !important; }
          .no-print { display: none !important; }
          @page { margin: 0.5in; }
        }
      `}</style>

      <div className="report-printable bg-white rounded-xl shadow-2xl w-full max-w-4xl my-4 print:shadow-none print:rounded-none print:my-0">
        {/* Action bar */}
        <div className="no-print flex items-center justify-between px-6 py-3 border-b sticky top-0 bg-white z-10 rounded-t-xl">
          <h2 className="font-semibold text-sm">Profit Pace Report</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5 mr-1" /> Print / Export PDF
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Report content */}
        <div className="px-8 py-6 print:px-6 print:py-4">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-slate-900">{job.job_name}</h1>
            {job.client_name && <p className="text-sm text-slate-600 mt-1">Client: {job.client_name}</p>}
            <p className="text-xs text-slate-400 mt-1">Generated: {format(now, "MMM d, yyyy h:mm a")}</p>
          </div>

          {/* Financial Summary */}
          <Section title="Financial Summary">
            <ReportGrid rows={[
              { label: "Contract Value", value: fmtMoney(contractValue) },
              { label: "Total Estimated Cost", value: fmtMoney(totalEstCost) },
              { label: "Projected Gross Profit", value: fmtMoney(grossProfit), bold: true },
              { label: "Gross Margin %", value: `${marginPct.toFixed(1)}%`, bold: true },
              { label: "Markup %", value: `${markupPct.toFixed(1)}%` },
              { label: "Target Margin %", value: `${targetMargin}%` },
            ]} />
          </Section>

          {/* Profit Pace */}
          <Section title="Profit Pace Status">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold" style={{ color: paceColor }}>{paceStatus}</span>
              <span className="text-sm text-slate-500">
                (Target: {targetMargin}% | Actual: {marginPct.toFixed(1)}%)
              </span>
            </div>
          </Section>

          {/* Labour Burden Summary */}
          <Section title="Labour Burden Summary">
            <ReportGrid rows={[
              { label: "Base Hourly Wage", value: fmtMoney(baseWage) },
              { label: "Fully Loaded Rate", value: fmtMoney(loadedRate) },
              { label: "Total Burden Cost", value: fmtMoney(totalBurdenCost), bold: true },
            ]} />
          </Section>

          {/* Change Orders */}
          <Section title={`Change Orders (${changeOrders.length})`}>
            {changeOrders.length === 0 ? (
              <p className="text-sm text-slate-400">No change orders recorded.</p>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-300">
                    <th className="text-left py-1.5 font-semibold text-slate-700">Description</th>
                    <th className="text-center py-1.5 font-semibold text-slate-700">Status</th>
                    <th className="text-right py-1.5 font-semibold text-slate-700">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {changeOrders.map(co => (
                    <tr key={co.id} className="border-b border-slate-100">
                      <td className="py-1.5 text-slate-700">{co.description || "—"}</td>
                      <td className="py-1.5 text-center capitalize text-slate-600">{co.status || "draft"}</td>
                      <td className="py-1.5 text-right text-slate-700">{fmtMoney(co.final_price_to_client || co.sell_price || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          {/* Leakage Detection */}
          <Section title="Leakage Detection Summary">
            {flags.length === 0 ? (
              <p className="text-sm text-emerald-600">No leakage flags detected.</p>
            ) : (
              <ul className="text-sm space-y-1">
                {flags.map((f, i) => (
                  <li key={i} className="text-red-600">• {f.flag_message || f.flag_type}</li>
                ))}
              </ul>
            )}
          </Section>

          {/* Warranty Summary */}
          {warranties.length > 0 && (
            <Section title={`Warranty Summary (${warranties.length})`}>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-300">
                    <th className="text-left py-1.5 font-semibold text-slate-700">Type</th>
                    <th className="text-left py-1.5 font-semibold text-slate-700">Description</th>
                    <th className="text-left py-1.5 font-semibold text-slate-700">Vendor</th>
                    <th className="text-left py-1.5 font-semibold text-slate-700">Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {warranties.map(w => (
                    <tr key={w.id} className="border-b border-slate-100">
                      <td className="py-1.5 text-slate-700">{w.warranty_type}</td>
                      <td className="py-1.5 text-slate-600">{w.description || "—"}</td>
                      <td className="py-1.5 text-slate-600">{w.vendor_responsible || "—"}</td>
                      <td className="py-1.5 text-slate-600">{w.end_date ? format(new Date(w.end_date), "MMM d, yyyy") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* Outstanding POs */}
          {outstandingPOs.length > 0 && (
            <Section title={`Outstanding Purchase Orders (${outstandingPOs.length})`}>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-300">
                    <th className="text-left py-1.5 font-semibold text-slate-700">PO #</th>
                    <th className="text-left py-1.5 font-semibold text-slate-700">Vendor</th>
                    <th className="text-center py-1.5 font-semibold text-slate-700">Status</th>
                    <th className="text-right py-1.5 font-semibold text-slate-700">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {outstandingPOs.map(po => (
                    <tr key={po.id} className="border-b border-slate-100">
                      <td className="py-1.5 text-slate-700">{po.po_number || `PO-${po.id?.slice(-6).toUpperCase()}`}</td>
                      <td className="py-1.5 text-slate-600">{po.vendor_name}</td>
                      <td className="py-1.5 text-center capitalize text-slate-600">{po.status}</td>
                      <td className="py-1.5 text-right text-slate-700">{fmtMoney(po.po_amount || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* Footer */}
          <div className="border-t-2 border-slate-200 mt-8 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Report generated {format(now, "MMM d, yyyy 'at' h:mm a")} · Contractor Profitability Suite
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function ReportGrid({ rows }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {rows.map((r, i) => (
        <div key={i}>
          <p className="text-xs text-slate-400">{r.label}</p>
          <p className={`text-sm ${r.bold ? "font-bold text-slate-900" : "text-slate-700"}`}>{r.value}</p>
        </div>
      ))}
    </div>
  );
}

function fmtMoney(n) {
  return `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}