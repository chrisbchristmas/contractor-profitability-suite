import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";

function getWarrantyStatus(endDate) {
  if (!endDate) return "unknown";
  const days = differenceInDays(new Date(endDate), new Date());
  if (days < 0) return "expired";
  if (days <= 30) return "expiring";
  return "active";
}

const STATUS_BADGE = {
  active: { label: "Active", color: "bg-emerald-100 text-emerald-700", icon: ShieldCheck },
  expiring: { label: "Expiring Soon", color: "bg-amber-100 text-amber-700", icon: ShieldAlert },
  expired: { label: "Expired", color: "bg-slate-100 text-slate-500", icon: ShieldX },
  unknown: { label: "No End Date", color: "bg-slate-100 text-slate-500", icon: Shield },
};

export default function Warranties() {
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);

  const { data: warranties = [], isLoading } = useQuery({
    queryKey: ["warranties"],
    queryFn: () => base44.entities.Warranty.list(),
  });

  // Sort by expiry date soonest first
  const sorted = [...warranties].sort((a, b) => {
    const aDate = a.end_date ? new Date(a.end_date).getTime() : Infinity;
    const bDate = b.end_date ? new Date(b.end_date).getTime() : Infinity;
    return aDate - bDate;
  });

  const activeCount = warranties.filter(w => getWarrantyStatus(w.end_date) === "active").length;
  const expiringCount = warranties.filter(w => getWarrantyStatus(w.end_date) === "expiring").length;
  const expiredCount = warranties.filter(w => getWarrantyStatus(w.end_date) === "expired").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Warranties</h1>
        <p className="text-sm text-muted-foreground mt-1">All warranties across all jobs, sorted by expiry date.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1"><ShieldCheck className="h-4 w-4 text-emerald-500" /><p className="text-xs text-muted-foreground">Active</p></div>
          <p className="text-xl font-bold text-emerald-600">{activeCount}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1"><ShieldAlert className="h-4 w-4 text-amber-500" /><p className="text-xs text-muted-foreground">Expiring (30d)</p></div>
          <p className="text-xl font-bold text-amber-600">{expiringCount}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1"><ShieldX className="h-4 w-4 text-slate-400" /><p className="text-xs text-muted-foreground">Expired</p></div>
          <p className="text-xl font-bold text-slate-500">{expiredCount}</p>
        </CardContent></Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : sorted.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border p-16 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No warranties found</p>
          <p className="text-xs text-muted-foreground mt-1">Add warranties from a completed job's detail page.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(w => {
            const status = getWarrantyStatus(w.end_date);
            const badge = STATUS_BADGE[status];
            const StatusIcon = badge.icon;
            const daysLeft = w.end_date ? differenceInDays(new Date(w.end_date), new Date()) : null;
            return (
              <Link key={w.id} to={`${createPageUrl("JobDetail")}?id=${w.job_id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">{w.warranty_type}</span>
                          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", badge.color)}>
                            <StatusIcon className="h-3 w-3" />{badge.label}
                          </span>
                          {daysLeft !== null && daysLeft >= 0 && daysLeft <= 30 && (
                            <span className="text-xs text-amber-600 font-medium">{daysLeft} days left</span>
                          )}
                          {daysLeft !== null && daysLeft < 0 && (
                            <span className="text-xs text-slate-400 font-medium">{Math.abs(daysLeft)} days ago</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-700 mt-1">{w.description || "—"}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {w.job_name && <span className="text-xs text-blue-500 font-medium">{w.job_name}</span>}
                          {w.vendor_responsible && <span className="text-xs text-slate-400">{w.vendor_responsible}</span>}
                        </div>
                        {w.end_date && (
                          <p className="text-xs text-slate-400 mt-0.5">Expiry: {format(new Date(w.end_date), "MMM d, yyyy")}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}