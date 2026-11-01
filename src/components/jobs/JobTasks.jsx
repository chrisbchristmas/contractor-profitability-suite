import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, CheckSquare, Pencil, Trash2, Calendar } from "lucide-react";
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
  High: { badge: "bg-red-100 text-red-700", dot: "bg-red-500" },
  Medium: { badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  Low: { badge: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
};

export default function JobTasks({ jobId, job }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", "job", jobId],
    queryFn: () => base44.entities.Task.filter({ job_id: jobId }, "-created_date"),
    enabled: !!jobId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tasks", "job", jobId] }); queryClient.invalidateQueries({ queryKey: ["tasks", "all"] }); toast.success("Task created"); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tasks", "job", jobId] }); queryClient.invalidateQueries({ queryKey: ["tasks", "all"] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tasks", "job", jobId] }); queryClient.invalidateQueries({ queryKey: ["tasks", "all"] }); setDeleting(null); toast.success("Task deleted"); },
  });

  const toggleComplete = (task) => {
    const newStatus = task.status === "Done" ? "To Do" : "Done";
    updateMutation.mutate({ id: task.id, data: { status: newStatus } });
  };

  const sorted = [...tasks].sort((a, b) => {
    const statusOrder = { "To Do": 0, "In Progress": 1, "Done": 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
    const prioOrder = { High: 0, Medium: 1, Low: 2 };
    if (prioOrder[a.priority] !== prioOrder[b.priority]) return prioOrder[a.priority] - prioOrder[b.priority];
    return new Date(a.due_date || "9999") - new Date(b.due_date || "9999");
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Tasks ({tasks.filter(t => t.status !== "Done").length} open)</h2>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Task
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : sorted.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border p-10 text-center">
          <CheckSquare className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No tasks yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(task => {
            const scfg = STATUS_CONFIG[task.status] || STATUS_CONFIG["To Do"];
            const pcfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;
            const overdue = task.due_date && task.status !== "Done" && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
            return (
              <div key={task.id} className={cn("bg-card rounded-xl border border-border p-3 flex items-center gap-3", task.status === "Done" && "opacity-60")}>
                <button
                  onClick={() => toggleComplete(task)}
                  className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                    task.status === "Done" ? "bg-emerald-500 border-emerald-500" : "border-slate-300 hover:border-blue-500"
                  )}
                >
                  {task.status === "Done" && <CheckSquare className="w-3 h-3 text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium text-foreground", task.status === "Done" && "line-through")}>{task.title}</p>
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
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400" onClick={() => { setEditing(task); setShowForm(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => setDeleting(task)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TaskForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        editing={editing}
        jobId={jobId}
        job={job}
        onSave={(data) => {
          if (editing) updateMutation.mutate({ id: editing.id, data });
          else createMutation.mutate(data);
        }}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      {deleting && (
        <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Delete Task?</DialogTitle></DialogHeader>
            <p className="text-sm text-slate-500">Delete "{deleting.title}"?</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={() => deleteMutation.mutate(deleting.id)} disabled={deleteMutation.isPending}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function TaskForm({ open, onClose, editing, jobId, job, onSave, isPending }) {
  const [form, setForm] = useState({
    title: "", description: "", assigned_to: "", due_date: "", status: "To Do", priority: "Medium",
  });

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title || "",
        description: editing.description || "",
        assigned_to: editing.assigned_to || "",
        due_date: editing.due_date || "",
        status: editing.status || "To Do",
        priority: editing.priority || "Medium",
      });
    } else {
      setForm({ title: "", description: "", assigned_to: "", due_date: "", status: "To Do", priority: "Medium" });
    }
  }, [editing, open]);

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      job_id: jobId,
      job_name: job?.job_name || "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Edit Task" : "New Task"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs text-slate-500">Title *</Label>
            <Input value={form.title} onChange={f("title")} required className="mt-1" placeholder="e.g. Order materials for framing" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Description</Label>
            <Textarea value={form.description} onChange={f("description")} className="mt-1" rows={2} />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Assigned To</Label>
            <Input value={form.assigned_to} onChange={f("assigned_to")} className="mt-1" placeholder="Crew member name" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Due Date</Label>
              <Input type="date" value={form.due_date} onChange={f("due_date")} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Status</Label>
              <select value={form.status} onChange={f("status")} className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option>To Do</option>
                <option>In Progress</option>
                <option>Done</option>
              </select>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Priority</Label>
              <select value={form.priority} onChange={f("priority")} className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isPending}>
              {isPending ? "Saving..." : editing ? "Update Task" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}