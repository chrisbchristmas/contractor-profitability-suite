import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";

export default function SaveJobTemplateDialog({ job, open, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    template_name: "",
    trade_type: "",
    description: "",
    estimated_labor_hours: "",
    estimated_labor_cost: "",
    estimated_material_cost: "",
    overhead_percent: "",
    profit_target_percent: "",
    notes: "",
  });

  useEffect(() => {
    if (open && job) {
      setForm({
        template_name: job.job_name ? `${job.job_name} Template` : "",
        trade_type: "",
        description: "",
        estimated_labor_hours: job.estimated_labor_hours ?? (job.total_estimated_hours ?? ""),
        estimated_labor_cost: job.estimated_cost ? (job.estimated_cost * 0.4).toFixed(2) : "",
        estimated_material_cost: job.estimated_material_cost ?? (job.material_cost ?? ""),
        overhead_percent: "",
        profit_target_percent: job.target_margin_percent ?? "",
        notes: job.client_notes ?? "",
      });
    }
  }, [open, job]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.JobTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobTemplates"] });
      toast.success("Job saved as template");
      onClose();
    },
  });

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      estimated_labor_hours: form.estimated_labor_hours !== "" ? parseFloat(form.estimated_labor_hours) : null,
      estimated_labor_cost: form.estimated_labor_cost !== "" ? parseFloat(form.estimated_labor_cost) : null,
      estimated_material_cost: form.estimated_material_cost !== "" ? parseFloat(form.estimated_material_cost) : null,
      overhead_percent: form.overhead_percent !== "" ? parseFloat(form.overhead_percent) : null,
      profit_target_percent: form.profit_target_percent !== "" ? parseFloat(form.profit_target_percent) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Save Job as Template</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs text-slate-500">Template Name *</Label>
            <Input value={form.template_name} onChange={f("template_name")} required className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Trade Type</Label>
            <Input value={form.trade_type} onChange={f("trade_type")} className="mt-1" placeholder="e.g. Plumbing, Roofing" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Description</Label>
            <Textarea value={form.description} onChange={f("description")} className="mt-1" rows={2} />
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
            <Textarea value={form.notes} onChange={f("notes")} className="mt-1" rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}