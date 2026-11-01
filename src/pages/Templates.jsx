import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Layers, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const $ = (n) => `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

const EMPTY_FORM = {
  template_name: "", description: "", category: "",
  labor_hours: "", labor_rate: "", labor_burden_percent: "",
  material_cost: "", equipment_cost: "", subcontractor_cost: "",
  markup_percent: "", overhead_percent: "", tax_percent: "",
};

export default function Templates() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["coTemplates"],
    queryFn: () => base44.entities.COTemplate.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.COTemplate.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["coTemplates"] }); closeForm(); toast.success("Template saved"); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.COTemplate.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["coTemplates"] }); closeForm(); toast.success("Template updated"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.COTemplate.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["coTemplates"] }); setDeleting(null); toast.success("Template deleted"); },
  });

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      template_name: t.template_name || "", description: t.description || "", category: t.category || "",
      labor_hours: t.labor_hours ?? "", labor_rate: t.labor_rate ?? "", labor_burden_percent: t.labor_burden_percent ?? "",
      material_cost: t.material_cost ?? "", equipment_cost: t.equipment_cost ?? "", subcontractor_cost: t.subcontractor_cost ?? "",
      markup_percent: t.markup_percent ?? "", overhead_percent: t.overhead_percent ?? "", tax_percent: t.tax_percent ?? "",
    });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); setForm(EMPTY_FORM); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsed = {
      ...form,
      labor_hours: form.labor_hours !== "" ? parseFloat(form.labor_hours) : null,
      labor_rate: form.labor_rate !== "" ? parseFloat(form.labor_rate) : null,
      labor_burden_percent: form.labor_burden_percent !== "" ? parseFloat(form.labor_burden_percent) : null,
      material_cost: form.material_cost !== "" ? parseFloat(form.material_cost) : null,
      equipment_cost: form.equipment_cost !== "" ? parseFloat(form.equipment_cost) : null,
      subcontractor_cost: form.subcontractor_cost !== "" ? parseFloat(form.subcontractor_cost) : null,
      markup_percent: form.markup_percent !== "" ? parseFloat(form.markup_percent) : null,
      overhead_percent: form.overhead_percent !== "" ? parseFloat(form.overhead_percent) : null,
      tax_percent: form.tax_percent !== "" ? parseFloat(form.tax_percent) : null,
    };
    if (editing) { updateMutation.mutate({ id: editing.id, data: parsed }); }
    else { createMutation.mutate(parsed); }
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">CO Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">Save common change orders for quick reuse</p>
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
          <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No templates yet</p>
          <p className="text-xs text-muted-foreground mt-1">Save common change orders to use as starting points</p>
          <Button variant="outline" className="mt-4" onClick={() => setShowForm(true)}>Create your first template</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <div key={t.id} className="bg-card rounded-xl border border-border p-5 hover:border-blue-200 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-foreground">{t.template_name}</h3>
                  {t.category && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{t.category}</span>}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => setDeleting(t)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              {t.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{t.description}</p>}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {t.labor_hours > 0 && <div className="text-slate-500"><span className="text-slate-400">Labor:</span> {t.labor_hours}h @ ${t.labor_rate}/hr</div>}
                {t.material_cost > 0 && <div className="text-slate-500"><span className="text-slate-400">Materials:</span> {$(t.material_cost)}</div>}
                {t.markup_percent > 0 && <div className="text-slate-500"><span className="text-slate-400">Markup:</span> {t.markup_percent}%</div>}
                {t.overhead_percent > 0 && <div className="text-slate-500"><span className="text-slate-400">Overhead:</span> {t.overhead_percent}%</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={closeForm}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Template" : "New Template"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs text-slate-500">Template Name *</Label>
                <Input value={form.template_name} onChange={f("template_name")} required className="mt-1" placeholder="e.g. Electrical Rough-In" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-slate-500">Category</Label>
                <Input value={form.category} onChange={f("category")} className="mt-1" placeholder="e.g. Electrical, Plumbing, HVAC" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-slate-500">Description</Label>
                <Input value={form.description} onChange={f("description")} className="mt-1" />
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-1">Labor</p>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs text-slate-500">Hours</Label><Input type="number" step="0.25" value={form.labor_hours} onChange={f("labor_hours")} className="mt-1" /></div>
              <div><Label className="text-xs text-slate-500">Rate ($/hr)</Label><Input type="number" value={form.labor_rate} onChange={f("labor_rate")} className="mt-1" /></div>
              <div><Label className="text-xs text-slate-500">Burden %</Label><Input type="number" value={form.labor_burden_percent} onChange={f("labor_burden_percent")} className="mt-1" /></div>
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-1">Costs</p>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs text-slate-500">Materials</Label><Input type="number" value={form.material_cost} onChange={f("material_cost")} className="mt-1" /></div>
              <div><Label className="text-xs text-slate-500">Equipment</Label><Input type="number" value={form.equipment_cost} onChange={f("equipment_cost")} className="mt-1" /></div>
              <div><Label className="text-xs text-slate-500">Subcontractor</Label><Input type="number" value={form.subcontractor_cost} onChange={f("subcontractor_cost")} className="mt-1" /></div>
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-1">Pricing</p>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs text-slate-500">Markup %</Label><Input type="number" value={form.markup_percent} onChange={f("markup_percent")} className="mt-1" /></div>
              <div><Label className="text-xs text-slate-500">Overhead %</Label><Input type="number" value={form.overhead_percent} onChange={f("overhead_percent")} className="mt-1" /></div>
              <div><Label className="text-xs text-slate-500">Tax %</Label><Input type="number" value={form.tax_percent} onChange={f("tax_percent")} className="mt-1" /></div>
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