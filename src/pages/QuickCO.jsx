import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MobileSelect from "@/components/ui/MobileSelect";
import { useCustomerAuth } from "@/lib/CustomerAuthContext";
import { Zap, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

const $ = (n) => `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function QuickCO() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { customer } = useCustomerAuth();

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["activeJobs"],
    queryFn: () => base44.entities.Job.filter({ status: "active" }, "-created_date"),
  });

  const defaultWage = customer?.base_hourly_wage;
  const defaultBurden = customer?.labor_burden_percent ?? 35;
  const defaultOverhead = customer?.default_overhead_percent ?? 15;
  const defaultMarkup = customer?.default_markup_percent ?? 20;

  const [form, setForm] = useState({
    job_id: "",
    description: "",
    labor_hours: "",
    base_hourly_wage: "",
    labor_burden_percent: String(defaultBurden),
    material_cost: "",
    overhead_percent: String(defaultOverhead),
    markup_percent: String(defaultMarkup),
  });

  // Pre-fill wage once customer settings load
  useEffect(() => {
    if (defaultWage != null && !form.base_hourly_wage) {
      setForm((p) => ({ ...p, base_hourly_wage: String(defaultWage) }));
    }
  }, [defaultWage]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const calc = useMemo(() => {
    const hours = parseFloat(form.labor_hours) || 0;
    const wage = parseFloat(form.base_hourly_wage) || 0;
    const burden = parseFloat(form.labor_burden_percent) || 0;
    const materials = parseFloat(form.material_cost) || 0;
    const overhead = parseFloat(form.overhead_percent) || 0;
    const markup = parseFloat(form.markup_percent) || 0;

    const totalLaborCost = hours * wage * (1 + burden / 100);
    const subtotal = totalLaborCost + materials;
    const totalCost = subtotal + subtotal * (overhead / 100);
    const coPrice = totalCost * (1 + markup / 100);
    const grossMargin = coPrice > 0 ? ((coPrice - totalCost) / coPrice) * 100 : 0;

    return { totalLaborCost, subtotal, totalCost, coPrice, grossMargin };
  }, [form]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ChangeOrder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["changeOrders"] });
      toast.success("Change order created");
      navigate(createPageUrl("JobDetail") + `?id=${form.job_id}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.job_id) { toast.error("Please select a job"); return; }
    if (!form.description.trim()) { toast.error("Please enter a description"); return; }

    const hours = parseFloat(form.labor_hours) || 0;
    const wage = parseFloat(form.base_hourly_wage) || 0;
    const burden = parseFloat(form.labor_burden_percent) || 0;
    const materials = parseFloat(form.material_cost) || 0;
    const overhead = parseFloat(form.overhead_percent) || 0;
    const markup = parseFloat(form.markup_percent) || 0;

    const totalLaborCost = hours * wage * (1 + burden / 100);
    const subtotal = totalLaborCost + materials;
    const overheadAmount = subtotal * (overhead / 100);
    const totalCost = subtotal + overheadAmount;
    const coPrice = totalCost * (1 + markup / 100);
    const grossMargin = coPrice > 0 ? ((coPrice - totalCost) / coPrice) * 100 : 0;

    createMutation.mutate({
      job_id: form.job_id,
      description: form.description.trim(),
      labor_hours: hours,
      base_hourly_wage: wage || null,
      labor_burden_percent: burden,
      labor_rate: wage,
      material_cost: materials,
      overhead_percent: overhead,
      markup_percent: markup,
      true_labor_cost: totalLaborCost,
      burden_amount_per_hour: wage * (burden / 100),
      fully_loaded_rate: wage * (1 + burden / 100),
      total_labor_burden_cost: wage * (burden / 100) * hours,
      subtotal_before_overhead: subtotal,
      overhead_amount: overheadAmount,
      total_cost: totalCost,
      sell_price: coPrice,
      final_price_to_client: coPrice,
      true_margin_percent: Math.round(grossMargin * 100) / 100,
      target_margin: customer?.target_margin_percent ?? null,
      status: "draft",
    });
  };

  const marginColor = calc.grossMargin >= 30 ? "text-emerald-400" : calc.grossMargin >= 15 ? "text-amber-400" : "text-red-400";

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <Link to={createPageUrl("Dashboard")} className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-3">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>

      <div className="flex items-center gap-2 mb-6">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground leading-tight">Quick Change Order</h1>
          <p className="text-xs text-muted-foreground">Fast jobsite entry</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Job selector */}
        <div>
          <Label className="text-sm font-semibold text-slate-700">Job</Label>
          <MobileSelect
            value={form.job_id}
            onValueChange={(v) => update("job_id", v)}
            placeholder={jobsLoading ? "Loading jobs..." : "Select a job"}
            triggerClassName="mt-1.5 !h-14 !text-base w-full font-medium"
            options={jobs.map((j) => ({ value: j.id, label: j.job_name }))}
          />
        </div>

        {/* Description */}
        <div>
          <Label className="text-sm font-semibold text-slate-700">Description</Label>
          <Textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Describe the change order work..."
            className="mt-1.5 min-h-[120px] text-base rounded-xl"
            required
          />
        </div>

        {/* Labor hours */}
        <LargeInput label="Labor Hours" value={form.labor_hours} onChange={(v) => update("labor_hours", v)} placeholder="0" />

        {/* Base hourly wage */}
        <LargeInput label="Base Hourly Wage ($/hr)" value={form.base_hourly_wage} onChange={(v) => update("base_hourly_wage", v)} placeholder="0.00" prefix="$" />

        {/* Labor burden % */}
        <LargeInput label="Labor Burden %" value={form.labor_burden_percent} onChange={(v) => update("labor_burden_percent", v)} placeholder="35" suffix="%" />

        {/* Material cost */}
        <LargeInput label="Material Cost ($)" value={form.material_cost} onChange={(v) => update("material_cost", v)} placeholder="0.00" prefix="$" />

        {/* Overhead % */}
        <LargeInput label="Overhead %" value={form.overhead_percent} onChange={(v) => update("overhead_percent", v)} placeholder="15" suffix="%" />

        {/* Markup % */}
        <LargeInput label="Markup %" value={form.markup_percent} onChange={(v) => update("markup_percent", v)} placeholder="20" suffix="%" />

        {/* Live calculation summary */}
        <div className="bg-slate-800 rounded-2xl p-5 space-y-3">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Live Summary</p>
          <div className="space-y-2.5">
            <SummaryRow label="Total Labor Cost" value={$(calc.totalLaborCost)} />
            <SummaryRow label="Total Cost" value={$(calc.totalCost)} />
            <div className="border-t border-slate-700 pt-2.5">
              <SummaryRow label="CO Price" value={$(calc.coPrice)} valueClass="text-blue-400" bold />
            </div>
            <SummaryRow
              label="Gross Margin %"
              value={`${calc.grossMargin.toFixed(1)}%`}
              valueClass={marginColor}
              bold
            />
          </div>
        </div>

        {/* Save button */}
        <Button
          type="submit"
          size="lg"
          className="w-full h-14 text-base font-semibold bg-blue-600 hover:bg-blue-700"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><Zap className="h-5 w-5 mr-2" /> Save Change Order</>
          )}
        </Button>
      </form>
    </div>
  );
}

function LargeInput({ label, value, onChange, placeholder, prefix, suffix }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      <div className="relative mt-1.5">
        {prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-slate-400 font-medium">{prefix}</span>}
        <Input
          type="number"
          step="any"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "0"}
          className={`h-14 text-base rounded-xl ${prefix ? "pl-9" : ""} ${suffix ? "pr-12" : ""}`}
        />
        {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base text-slate-400 font-medium">{suffix}</span>}
      </div>
    </div>
  );
}

function SummaryRow({ label, value, valueClass, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm text-slate-400 ${bold ? "font-semibold" : ""}`}>{label}</span>
      <span className={`text-base font-bold ${valueClass || "text-white"}`}>{value}</span>
    </div>
  );
}