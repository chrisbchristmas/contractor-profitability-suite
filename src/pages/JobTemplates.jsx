import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Bookmark, Pencil, Trash2, Copy, Wrench } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const $ = (n) => `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

const EMPTY_FORM = {
  template_name: "", trade_type: "", description: "",
  estimated_labor_hours: "", estimated_labor_cost: "",
  estimated_material_cost: "", overhead_percent: "",
  profit_target_percent: "", notes: "",
};

export default function JobTemplates() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["jobTemplates"],
    queryFn: () => base44.entities.JobTemplate.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.JobTemplate.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["jobTemplates"] }); closeForm(); toast.success("Template saved"); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.JobTemplate.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["jobTemplates"] }); closeForm(); toast.success("Template updated"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.JobTemplate.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["jobTemplates"] }); setDeleting(null); toast.success("Template deleted"); },
  });

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      template_name: t.template_name || "",
      trade_type: t.trade_type || "",
      description: t.description || "",
      estimated_labor_hours: t.estimated_labor_hours ?? "",
      estimated_labor_cost: t.estimated_labor_cost ?? "",
      estimated_material_cost: t.estimated_material_cost ?? "",
      overhead_percent: t.overhead_percent ?? "",
      profit_target_percent: t.profit_target_percent ?? "",
      notes: t.notes || "",
    });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); setForm(EMPTY_FORM); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsed = {
      ...form,
      estimated_labor_hours: form.estimated_labor_hours !== "" ? parseFloat(form.estimated_labor_hours) : null,
      estimated_labor_cost: form.estimated_labor_cost !== "" ? parseFloat(form.estimated_labor_cost) : null,
      estimated_material_cost: form.estimated_material_cost !== "" ? parseFloat(form.estimated_material_cost) : null,
      overhead_percent: form.overhead_percent !== "" ? parseFloat(form.overhead_percent) : null,
      profit_target_percent: form.profit_target_percent !== "" ? parseFloat(form.profit_target_percent) : null,
    };
    if (editing) { updateMutation.mutate({ id: editing.id, data: parsed }); }
    else { createMutation.mutate(parsed); }
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Job Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">Save recurring job types for quick creation</p>
        </div>
        <Button className="mt-3 sm:mt-0 bg-blue-600 hover:bg-blue-700" onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1.5" /> New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border p-16 text-center">
          <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No job templates yet</p>
          <p className="text-xs text-muted-foreground mt-1">Save recurring job types to pre-fill new jobs instantly</p>
          <Button variant="outline" className="mt-4" onClick={() => setShowForm(true)}>Create your first template</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <div key={t.id} className="bg-card rounded-xl border border-border p-5 hover:border-blue-200 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{t.template_name}</h3>
                  {t.trade_type && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">{t.trade_type}</span>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => setDeleting(t)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              {t.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{t.description}</p>}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {t.estimated_labor_hours > 0 && <div className="text-slate-500"><span className="text-slate-400">Labor:</span> {t.estimated_labor_hours}h</div>}
                {t.estimated_labor_cost > 0 && <div className="text-slate-500"><span className="text-slate-400">Labor Cost:</span> {$(t.estimated_labor_cost)}</div>}
                {t.estimated_material_cost > 0 && <div className="text-slate-500"><span className="text-slate-400">Materials:</span> {$(t.estimated_material_cost)}</div>}
                {t.profit_target_percent > 0 && <div className="text-slate-500"><span className="text-slate-400">Target:</span> {t.profit_target_percent}%</div>}
              </div>
              {t.notes && <p className="text-xs text-slate-400 mt-3 line-clamp-1 italic">{t.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={closeForm}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Template" : "New Job Template"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs text-slate-500">Template Name *</Label>
              <Input value={form.template_name} onChange={f("template_name")} required className="mt-1" placeholder="e.g. Bathroom Remodel - Standard" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Trade Type</Label>
              <Input value={form.trade_type} onChange={f("trade_type")} className="mt-1" placeholder="e.g. Plumbing, Roofing, General" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Description</Label>
              <Textarea value={form.description} onChange={f("description")} className="mt-1" rows={2} placeholder="Scope of work included in this template" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-500">Est. Labor Hours</Label>
                <Input type="number" step="0.25" value={form.estimated_labor_hours} onChange={f("estimated_labor_hours")} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Est. Labor Cost ($)</Label>
                <Input type="number" value={form.estimated_labor_cost} onChange={f("estimated_labor_cost")} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-slate-500">Material Cost ($)</Label>
                <Input type="number" value={form.estimated_material_cost} onChange={f("estimated_material_cost")} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Overhead %</Label>
                <Input type="number" value={form.overhead_percent} onChange={f("overhead_percent")} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Target Profit %</Label>
                <Input type="number" value={form.profit_target_percent} onChange={f("profit_target_percent")} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Notes</Label>
              <Textarea value={form.notes} onChange={f("notes")} className="mt-1" rows={2} placeholder="Any additional notes or instructions" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save Template"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      {deleting && (
        <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Delete Template?</DialogTitle></DialogHeader>
            <p className="text-sm text-slate-500">Are you sure you want to delete "{deleting.template_name}"?</p>
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