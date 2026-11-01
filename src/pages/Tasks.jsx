import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, CheckSquare, Search, Calendar, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format, isPast, isToday } from "date-fns";
import { toast } from "sonner";

const STATUS_CONFIG = {
  "To Do": { badge: "bg-slate-100 text-slate-600" },
  "In Progress": { badge: "bg-blue-100 text-blue-700" },
  "Done": { badge: "bg-emerald-100 text-emerald-700" },
};

const PRIORITY_CONFIG = {
  High: { badge: "bg-red-100 text-red-700", dot: "bg-red-500", order: 0 },
  Medium: { badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500", order: 1 },
  Low: { badge: "bg-slate-100 text-slate-600", dot: "bg-slate-400", order: 2 },
};

const PRIORITY_OPTIONS = [
  { value: "all", label: "All Priorities" },
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
];

export default function Tasks() {
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("due_date");
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", "all"],
    queryFn: () => base44.entities.Task.list("-created_date"),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list("-created_date"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tasks", "all"] }); },
  });

  const filtered = tasks
    .filter(t => t.status !== "Done")
    .filter(t => priorityFilter === "all" || t.priority === priorityFilter)
    .filter(t => !search || t.title?.toLowerCase().includes(search.toLowerCase()) || t.job_name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "due_date") return new Date(a.due_date || "9999-12-31") - new Date(b.due_date || "9999-12-31");
      if (sortBy === "priority") {
        const pa = PRIORITY_CONFIG[a.priority]?.order ?? 9;
        const pb = PRIORITY_CONFIG[b.priority]?.order ?? 9;
        return pa - pb;
      }
      return 0;
    });

  const toggleComplete = (task) => {
    updateMutation.mutate({ id: task.id, data: { status: "Done" } });
    toast.success("Task marked complete");
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">Open tasks across all jobs</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Open Tasks</p>
          <p className="text-xl font-bold text-foreground">{tasks.filter(t => t.status !== "Done").length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">High Priority</p>
          <p className="text-xl font-bold text-red-600">{tasks.filter(t => t.priority === "High" && t.status !== "Done").length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Overdue</p>
          <p className="text-xl font-bold text-amber-600">{tasks.filter(t => t.due_date && t.status !== "Done" && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date))).length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="due_date">Sort by Due Date</option>
          <option value="priority">Sort by Priority</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border p-16 text-center">
          <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{search ? "No matching tasks" : "No open tasks"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const scfg = STATUS_CONFIG[task.status] || STATUS_CONFIG["To Do"];
            const pcfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;
            const overdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
            return (
              <div key={task.id} className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
                <button
                  onClick={() => toggleComplete(task)}
                  className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors border-slate-300 hover:border-emerald-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                  {task.description && <p className="text-xs text-muted-foreground truncate">{task.description}</p>}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full", scfg.badge)}>{task.status}</span>
                    <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full", pcfg.badge)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", pcfg.dot)} />{task.priority}
                    </span>
                    {task.assigned_to && <span className="text-xs text-muted-foreground">@ {task.assigned_to}</span>}
                    {task.due_date && (
                      <span className={cn("text-xs flex items-center gap-1", overdue ? "text-red-600 font-medium" : "text-muted-foreground")}>
                        <Calendar className="h-3 w-3" />{format(new Date(task.due_date), "MMM d")}{overdue && " (overdue)"}
                      </span>
                    )}
                    {task.job_name && (
                      <Link to={createPageUrl("JobDetail") + `?id=${task.job_id}`} className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                        {task.job_name} <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}