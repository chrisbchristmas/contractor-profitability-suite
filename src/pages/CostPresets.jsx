import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CostPresets() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const queryClient = useQueryClient();

  const { data: presets = [], isLoading } = useQuery({
    queryKey: ["presets"],
    queryFn: () => base44.entities.CostPreset.list("-created_date"),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.CostPreset.update(editing.id, data)
      : base44.entities.CostPreset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presets"] });
      setShowForm(false);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CostPreset.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presets"] });
      setDeleting(null);
    },
  });

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Cost Presets</h1>
          <p className="text-sm text-muted-foreground mt-1">Reusable rate templates for trades and services</p>
        </div>
        <Button className="mt-3 sm:mt-0 bg-blue-600 hover:bg-blue-700" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1.5" /> New Preset
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-[100px] rounded-xl" />)}
        </div>
      ) : presets.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border p-16 text-center">
          <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No presets yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create presets to quickly apply rates to change orders</p>
          <Button variant="outline" className="mt-4" onClick={() => { setEditing(null); setShowForm(true); }}>
            Create your first preset
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {presets.map(preset => (
            <div key={preset.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{preset.preset_name}</h3>
                  <div className="flex flex-wrap gap-4 mt-3">
                    <PresetField label="Labor Rate" value={`$${preset.labor_rate || 0}/hr`} />
                    <PresetField label="Burden" value={`${preset.labor_burden_percent || 0}%`} />
                    <PresetField label="Markup" value={`${preset.markup_percent || 0}%`} />
                    <PresetField label="Overhead" value={`${preset.overhead_percent || 0}%`} />
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 ml-3">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(preset); setShowForm(true); }}>
                    <Edit className="h-3.5 w-3.5 text-slate-400" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleting(preset)}>
                    <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <PresetFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        editing={editing}
        onSave={(data) => saveMutation.mutate(data)}
        isPending={saveMutation.isPending}
      />

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Preset?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete "{deleting?.preset_name}".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteMutation.mutate(deleting.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PresetField({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}

function PresetFormDialog({ open, onClose, editing, onSave, isPending }) {
  const [form, setForm] = useState({ preset_name: "", labor_rate: "", labor_burden_percent: "", markup_percent: "", overhead_percent: "" });

  React.useEffect(() => {
    if (editing) {
      setForm({
        preset_name: editing.preset_name || "",
        labor_rate: editing.labor_rate ?? "",
        labor_burden_percent: editing.labor_burden_percent ?? "",
        markup_percent: editing.markup_percent ?? "",
        overhead_percent: editing.overhead_percent ?? "",
      });
    } else {
      setForm({ preset_name: "", labor_rate: "", labor_burden_percent: "", markup_percent: "", overhead_percent: "" });
    }
  }, [editing, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      preset_name: form.preset_name,
      labor_rate: parseFloat(form.labor_rate) || 0,
      labor_burden_percent: parseFloat(form.labor_burden_percent) || 0,
      markup_percent: parseFloat(form.markup_percent) || 0,
      overhead_percent: parseFloat(form.overhead_percent) || 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Preset" : "New Cost Preset"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs text-slate-500">Preset Name *</Label>
            <Input value={form.preset_name} onChange={e => setForm(p => ({...p, preset_name: e.target.value}))} required className="mt-1" placeholder="e.g. Electrician, Plumber" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Labor Rate ($/hr)</Label>
              <Input type="number" step="0.01" value={form.labor_rate} onChange={e => setForm(p => ({...p, labor_rate: e.target.value}))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Burden %</Label>
              <Input type="number" step="0.01" value={form.labor_burden_percent} onChange={e => setForm(p => ({...p, labor_burden_percent: e.target.value}))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Markup %</Label>
              <Input type="number" step="0.01" value={form.markup_percent} onChange={e => setForm(p => ({...p, markup_percent: e.target.value}))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Overhead %</Label>
              <Input type="number" step="0.01" value={form.overhead_percent} onChange={e => setForm(p => ({...p, overhead_percent: e.target.value}))} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isPending}>
              {isPending ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}