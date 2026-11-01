import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Calendar, Pencil, Trash2, Sun, Cloud, CloudRain, Snowflake, Wind } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

const WEATHER_CONFIG = {
  Clear: { icon: Sun, color: "text-amber-500", badge: "bg-amber-50 text-amber-700" },
  Cloudy: { icon: Cloud, color: "text-slate-500", badge: "bg-slate-100 text-slate-700" },
  Rain: { icon: CloudRain, color: "text-blue-500", badge: "bg-blue-50 text-blue-700" },
  Snow: { icon: Snowflake, color: "text-cyan-500", badge: "bg-cyan-50 text-cyan-700" },
  Wind: { icon: Wind, color: "text-teal-500", badge: "bg-teal-50 text-teal-700" },
};

export default function JobDailyLogs({ jobId, job }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["dailyLogs", jobId],
    queryFn: () => base44.entities.DailyLog.filter({ job_id: jobId }, "-log_date"),
    enabled: !!jobId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DailyLog.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["dailyLogs", jobId] }); toast.success("Daily log created"); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DailyLog.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["dailyLogs", jobId] }); toast.success("Daily log updated"); setShowForm(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DailyLog.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["dailyLogs", jobId] }); setDeleting(null); toast.success("Daily log deleted"); },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Daily Logs ({logs.length})</h2>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Log
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : logs.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border p-10 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No daily logs yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map(log => {
            const wcfg = WEATHER_CONFIG[log.weather] || WEATHER_CONFIG.Cloudy;
            const WIcon = wcfg.icon;
            return (
              <div key={log.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <WIcon className={cn("h-4 w-4", wcfg.color)} />
                    <span className="font-semibold text-foreground text-sm">{format(new Date(log.log_date), "EEE, MMM d, yyyy")}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full", wcfg.badge)}>{log.weather}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400" onClick={() => { setEditing(log); setShowForm(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => setDeleting(log)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                  <span>Crew: <strong className="text-foreground">{log.crew_count || 0}</strong></span>
                  <span>Hours: <strong className="text-foreground">{log.hours_worked || 0}</strong></span>
                </div>
                {log.work_performed && <p className="text-sm text-foreground mb-1"><span className="text-xs font-semibold text-slate-400 uppercase">Work:</span> {log.work_performed}</p>}
                {log.issues_noted && <p className="text-sm text-red-600"><span className="text-xs font-semibold text-red-400 uppercase">Issues:</span> {log.issues_noted}</p>}
              </div>
            );
          })}
        </div>
      )}

      <DailyLogForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        editing={editing}
        jobId={jobId}
        job={job}
        onSave={(data, flags) => {
          if (editing) updateMutation.mutate({ id: editing.id, data });
          else createMutation.mutate(data);
        }}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      {deleting && (
        <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Delete Daily Log?</DialogTitle></DialogHeader>
            <p className="text-sm text-slate-500">Delete the log for {deleting.log_date ? format(new Date(deleting.log_date), "MMM d, yyyy") : "this entry"}?</p>
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

function DailyLogForm({ open, onClose, editing, jobId, job, onSave, isPending }) {
  const [form, setForm] = useState({
    log_date: "",
    weather: "Clear",
    crew_count: "",
    hours_worked: "",
    work_performed: "",
    issues_noted: "",
  });

  useEffect(() => {
    if (editing) {
      setForm({
        log_date: editing.log_date || "",
        weather: editing.weather || "Clear",
        crew_count: editing.crew_count ?? "",
        hours_worked: editing.hours_worked ?? "",
        work_performed: editing.work_performed || "",
        issues_noted: editing.issues_noted || "",
      });
    } else {
      setForm({ log_date: new Date().toISOString().split("T")[0], weather: "Clear", crew_count: "", hours_worked: "", work_performed: "", issues_noted: "" });
    }
  }, [editing, open]);

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      job_id: jobId,
      job_name: job?.job_name || "",
      crew_count: form.crew_count !== "" ? parseInt(form.crew_count) : null,
      hours_worked: form.hours_worked !== "" ? parseFloat(form.hours_worked) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Edit Daily Log" : "New Daily Log"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Date *</Label>
              <Input type="date" value={form.log_date} onChange={f("log_date")} required className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Weather</Label>
              <select value={form.weather} onChange={f("weather")} className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option>Clear</option>
                <option>Cloudy</option>
                <option>Rain</option>
                <option>Snow</option>
                <option>Wind</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Crew Count</Label>
              <Input type="number" value={form.crew_count} onChange={f("crew_count")} className="mt-1" placeholder="0" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Hours Worked</Label>
              <Input type="number" step="0.25" value={form.hours_worked} onChange={f("hours_worked")} className="mt-1" placeholder="0" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-slate-500">Work Performed</Label>
            <Textarea value={form.work_performed} onChange={f("work_performed")} className="mt-1" rows={3} placeholder="What was done today?" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Issues Noted</Label>
            <Textarea value={form.issues_noted} onChange={f("issues_noted")} className="mt-1" rows={2} placeholder="Delays, problems, concerns..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isPending}>
              {isPending ? "Saving..." : editing ? "Update Log" : "Create Log"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}