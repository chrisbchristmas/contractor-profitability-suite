import React, { useMemo, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { FileBarChart, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBurdenPercent } from "@/lib/laborBurden";
import { computeWipRow, computeWipTotals } from "@/lib/wipReport";
import { jobCostsToCsv } from "@/lib/qbExport";
import QbExportButton from "@/components/exports/QbExportButton";
import WipRow from "@/components/wip/WipRow";

const $ = (n) =>
  `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const pct = (n) => `${(n || 0).toFixed(1)}%`;

export default function WipReport() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs", "wip"],
    queryFn: () => base44.entities.Job.list("-created_date", 500),
  });
  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices", "wip"],
    queryFn: () => base44.entities.Invoice.list("-created_date", 500),
  });
  const { data: changeOrders = [] } = useQuery({
    queryKey: ["changeOrders", "wip"],
    queryFn: () => base44.entities.ChangeOrder.list("-created_date", 500),
  });
  const { data: timeEntries = [] } = useQuery({
    queryKey: ["timeEntries", "wip"],
    queryFn: () => base44.entities.TimeEntry.list("-created_date", 500),
  });
  const { data: crewCosts = [] } = useQuery({
    queryKey: ["crewCosts", "wip"],
    queryFn: () => base44.entities.CrewCost.list("-created_date", 500),
  });
  const { data: jobExpenses = [] } = useQuery({
    queryKey: ["jobExpenses", "wip"],
    queryFn: () => base44.entities.JobExpense.list("-created_date", 500),
  });
  const { data: customers = [] } = useQuery({
    queryKey: ["customers", "wip"],
    queryFn: () => base44.entities.Customer.list(),
  });

  // Company-wide burden % from the builder's Customer record (with fallback).
  const burdenPercent = useMemo(() => {
    const me = user?.email;
    const myCustomer = me
      ? customers.find((c) => c.email === me)
      : customers[0];
    return getBurdenPercent(null, myCustomer);
  }, [customers, user]);

  const rows = useMemo(() => {
    return jobs
      .filter(
        (j) =>
          j.status !== "completed" &&
          j.pipeline_status !== "Complete" &&
          j.pipeline_status !== "Invoiced"
      )
      .map((job) => {
        const jobCOs = changeOrders.filter((co) => co.job_id === job.id);
        const jobTime = timeEntries.filter((t) => t.job_id === job.id);
        const jobCrew = crewCosts.filter((c) => c.job_id === job.id);
        const jobExp = jobExpenses.filter((e) => e.job_id === job.id);
        return computeWipRow(
          job,
          jobCOs,
          invoices,
          jobTime,
          jobCrew,
          jobExp,
          getBurdenPercent(job, customers.find((c) => c.email === user?.email) || customers[0])
        );
      })
      .sort((a, b) => a.contract_value - b.contract_value);
  }, [jobs, invoices, changeOrders, timeEntries, crewCosts, jobExpenses, customers, user]);

  const totals = useMemo(() => computeWipTotals(rows), [rows]);
  const underbilledRows = useMemo(() => rows.filter((r) => r.is_underbilled), [rows]);

  const handleOverride = async (jobId, value) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    const patch =
      value == null
        ? { wip_pct_complete_override: null }
        : { wip_pct_complete_override: value };
    try {
      await base44.entities.Job.update(jobId, patch);
      queryClient.invalidateQueries({ queryKey: ["jobs", "wip"] });
    } catch {
      /* ignore — optimistic UI will refresh on next load */
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <FileBarChart className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">WIP Report</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Work-in-Progress over/under-billing across active jobs · burdened labor @ {pct(burdenPercent)} ·
          cost-to-cost % complete (click any row's % to override manually)
        </p>
      </div>

      <div className="flex justify-end mb-4">
        <QbExportButton
          label="Export Job Costs (CSV)"
          filename={`job-costs-${new Date().toISOString().split("T")[0]}.csv`}
          buildCsv={() => jobCostsToCsv(rows, burdenPercent)}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
          <span className="text-muted-foreground">Underbilled — earned but not invoiced (cash-flow risk)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
          <span className="text-muted-foreground">Overbilled — billed ahead of work (liability)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-amber-600 leading-none border border-amber-300 rounded px-1">M</span>
          <span className="text-muted-foreground">Manual % complete override in use</span>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : rows.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border p-16 text-center">
          <FileBarChart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No active jobs to report on</p>
        </div>
      ) : (
        <>
          {/* Underbilled callouts */}
          {underbilledRows.length > 0 && (
            <div className="mb-4 space-y-2">
              {underbilledRows.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm"
                >
                  <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span className="text-amber-900">
                    <strong>{r.job_name}:</strong> you've earned{" "}
                    <strong>{$(Math.abs(r.over_under_billed))}</strong> you haven't billed
                    yet on this job — consider invoicing.
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left font-semibold text-foreground px-4 py-3 whitespace-nowrap">Job Name</th>
                    <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">Contract Value</th>
                    <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">Est. Total Cost</th>
                    <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">Cost to Date</th>
                    <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">% Complete</th>
                    <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">Earned Revenue</th>
                    <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">Billed to Date</th>
                    <th className="text-right font-semibold text-foreground px-4 py-3 whitespace-nowrap">Over/(Under) Billed</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <WipRow
                      key={row.id}
                      row={row}
                      burdenPercent={burdenPercent}
                      onOverride={handleOverride}
                    />
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50 font-bold border-t-2 border-border">
                    <td className="px-4 py-3 text-foreground">TOTALS ({rows.length} jobs)</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{$(totals.contract_value)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{$(totals.estimated_total_cost)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{$(totals.actual_cost_to_date)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                      {totals.estimated_total_cost > 0
                        ? pct((totals.actual_cost_to_date / totals.estimated_total_cost) * 100)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-blue-600">{$(totals.earned_revenue)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{$(totals.billed_to_date)}</td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right tabular-nums",
                        totals.over_under_billed < 0
                          ? "text-red-600"
                          : totals.over_under_billed > 0
                          ? "text-blue-600"
                          : "text-emerald-600"
                      )}
                    >
                      {totals.over_under_billed < 0 ? "(" : ""}
                      {$(Math.abs(totals.over_under_billed))}
                      {totals.over_under_billed < 0 ? ")" : ""}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}