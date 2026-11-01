import React from "react";
import { TrendingUp, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const $ = (n) => `$${Math.round(n || 0).toLocaleString()}`;

export default function ProfitPaceCard({ jobs, user }) {
  const annualGoal = user?.annual_profit_goal || 0;

  // YTD profit: sum TOTAL_JOB_PROFIT for non-canceled jobs created this year
  const now = new Date();
  const ytdProfit = jobs
    .filter(j => j.status !== "canceled" && new Date(j.created_date).getFullYear() === now.getFullYear())
    .reduce((s, j) => s + (j._totalJobProfit || 0), 0);

  const pacePercent = annualGoal > 0 ? (ytdProfit / annualGoal) * 100 : 0;
  const status = pacePercent >= 100 ? "ON TRACK" : pacePercent >= 75 ? "CLOSE" : "BEHIND";
  const statusColor = status === "ON TRACK" ? "text-emerald-600 bg-emerald-50" : status === "CLOSE" ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";
  const barColor = status === "ON TRACK" ? "bg-emerald-500" : status === "CLOSE" ? "bg-amber-500" : "bg-red-500";

  if (!annualGoal) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-slate-700">Annual Profit Goal</h3>
        </div>
        <p className="text-xs text-slate-400">Set your annual profit goal in <span className="font-medium text-slate-500">Settings</span> to track your pace.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-slate-700">Profit Pace</h3>
        </div>
        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", statusColor)}>{status}</span>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        You are pacing toward <strong className="text-slate-800">{$(ytdProfit)}</strong> of your <strong className="text-slate-800">{$(annualGoal)}</strong> goal.
      </p>
      <div className="w-full bg-slate-100 rounded-full h-2 mb-1">
        <div className={cn("h-2 rounded-full transition-all", barColor)} style={{ width: `${Math.min(pacePercent, 100)}%` }} />
      </div>
      <p className="text-xs text-slate-400 text-right">{pacePercent.toFixed(1)}%</p>
    </div>
  );
}