import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, FileText, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import StressTestPanel from "@/components/estimates/StressTestPanel";

export default function Estimates() {
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const queryClient = useQueryClient();

  const { data: estimates = [], isLoading } = useQuery({
    queryKey: ["estimates"],
    queryFn: () => base44.entities.Estimate.list("-created_date"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Estimate.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["estimates"] }),
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Estimates</h1>
          <p className="text-sm text-muted-foreground mt-1">Stress-test your bids before accepting a job</p>
        </div>
        <Button className="mt-3 sm:mt-0 bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> New Estimate
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : estimates.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border p-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No estimates yet. Create one to stress-test your pricing.</p>
          <Button variant="outline" className="mt-4" onClick={() => setShowCreate(true)}>Create your first estimate</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {estimates.map(est => (
            <div
              key={est.id}
              className="bg-card rounded-xl border border-border p-5 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
              onClick={() => setSelected(est)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-foreground">{est.estimate_name}</p>
                  <p className="text-sm text-muted-foreground">${(est.contract_price || 0).toLocaleString()}</p>
                </div>
                {est.risk_level && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    est.risk_level === "High Risk" ? "bg-red-100 text-red-700" :
                    est.risk_level === "Moderate Risk" ? "bg-amber-100 text-amber-700" :
                    "bg-emerald-100 text-emerald-700"
                  }`}>{est.risk_level}</span>
                )}
              </div>
              <div className="text-xs text-slate-400 space-y-0.5">
                <p>Labor: ${(est.estimated_labor_cost || 0).toLocaleString()}</p>
                <p>Materials: ${(est.estimated_material_cost || 0).toLocaleString()}</p>
                <p>Subs: ${(est.estimated_subcontractor_cost || 0).toLocaleString()}</p>
                <p>Overhead: ${(est.estimated_overhead || 0).toLocaleString()}</p>
              </div>
              <button
                className="mt-3 text-red-400 hover:text-red-600 transition-colors"
                onClick={e => { e.stopPropagation(); deleteMutation.mutate(est.id); }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <CreateEstimateDialog open={showCreate} onClose={() => setShowCreate(false)} queryClient={queryClient} />

      {selected && (
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Stress Test — {selected.estimate_name}</DialogTitle>
            </DialogHeader>
            <StressTestPanel estimate={selected} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function CreateEstimateDialog({ open, onClose, queryClient }) {
  const [form, setForm] = useState({
    estimate_name: "", contract_price: "", estimated_labor_cost: "",
    estimated_material_cost: "", estimated_subcontractor_cost: "", estimated_overhead: "",
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Estimate.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["estimates"] }); onClose(); setForm({ estimate_name: "", contract_price: "", estimated_labor_cost: "", estimated_material_cost: "", estimated_subcontractor_cost: "", estimated_overhead: "" }); },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      estimate_name: form.estimate_name,
      contract_price: parseFloat(form.contract_price) || 0,
      estimated_labor_cost: parseFloat(form.estimated_labor_cost) || 0,
      estimated_material_cost: parseFloat(form.estimated_material_cost) || 0,
      estimated_subcontractor_cost: parseFloat(form.estimated_subcontractor_cost) || 0,
      estimated_overhead: parseFloat(form.estimated_overhead) || 0,
    });
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>New Estimate</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs text-slate-500">Estimate Name *</Label>
            <Input value={form.estimate_name} onChange={e => f("estimate_name", e.target.value)} required className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Contract Price *</Label>
            <Input type="number" step="0.01" value={form.contract_price} onChange={e => f("contract_price", e.target.value)} required className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Estimated Labor Cost</Label>
              <Input type="number" step="0.01" value={form.estimated_labor_cost} onChange={e => f("estimated_labor_cost", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Estimated Material Cost</Label>
              <Input type="number" step="0.01" value={form.estimated_material_cost} onChange={e => f("estimated_material_cost", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Subcontractor Cost</Label>
              <Input type="number" step="0.01" value={form.estimated_subcontractor_cost} onChange={e => f("estimated_subcontractor_cost", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Overhead Cost</Label>
              <Input type="number" step="0.01" value={form.estimated_overhead} onChange={e => f("estimated_overhead", e.target.value)} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Estimate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}