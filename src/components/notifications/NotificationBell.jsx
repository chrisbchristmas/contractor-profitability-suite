import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const TYPE_CONFIG = {
  margin_alert: { label: "Margin Alert", color: "text-red-600 bg-red-50", dot: "bg-red-500" },
  co_pending: { label: "CO Pending", color: "text-amber-600 bg-amber-50", dot: "bg-amber-500" },
  invoice_overdue: { label: "Invoice Overdue", color: "text-orange-600 bg-orange-50", dot: "bg-orange-500" },
};

export default function NotificationBell({ className }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => base44.entities.Notification.list("-created_date", 30),
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter((n) => !n.is_read);
      await base44.entities.Notification.bulkUpdate(
        unread.map((n) => ({ id: n.id, is_read: true }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
  });

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative text-slate-600 hover:text-slate-900 flex items-center justify-center min-w-[40px] min-h-[40px] rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-lg border border-slate-200 z-50 max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <span className="text-sm font-semibold text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium disabled:opacity-50"
                >
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <BellOff className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const cfg = TYPE_CONFIG[n.type] || { label: n.type, color: "text-slate-600 bg-slate-50", dot: "bg-slate-400" };
                  return (
                    <Link
                      key={n.id}
                      to={n.job_id ? `/JobDetail?id=${n.job_id}` : "#"}
                      onClick={() => {
                        if (!n.is_read) markReadMutation.mutate(n.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors",
                        !n.is_read && "bg-blue-50/40"
                      )}
                    >
                      <span className={cn("mt-1.5 w-2 h-2 rounded-full shrink-0", cfg.dot)} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={cn("text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded", cfg.color)}>
                            {cfg.label}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-auto">
                            {n.created_date ? formatDistanceToNow(new Date(n.created_date), { addSuffix: true }) : ""}
                          </span>
                        </div>
                        <p className={cn("text-xs leading-snug", n.is_read ? "text-slate-500" : "text-slate-700 font-medium")}>
                          {n.message}
                        </p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}