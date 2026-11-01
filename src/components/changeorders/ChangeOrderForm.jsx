import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MobileSelect from "@/components/ui/MobileSelect";
import { Save, X, Lock, Copy } from "lucide-react";
import { useCustomerAuth } from "@/lib/CustomerAuthContext";
import { calculateChangeOrder } from "./CalculationEngine";
import LiveCalcPanel from "./LiveCalcPanel";
import PhotoUploader from "./PhotoUploader";
import { canEditMarkup, canApproveCO, isAdmin } from "@/components/auth/permissions";
import { getTradePreset } from "@/lib/tradePresets";
import { getRegionalRate } from "@/lib/regionalRates";

export default function ChangeOrderForm({ initialData = {}, userDefaults = {}, jobTargetMargin, presets = [], currentUser, onSave, onCancel }) {
  const { customer } = useCustomerAuth();
  const { data: templates = [] } = useQuery({
    queryKey: ["coTemplates"],
    queryFn: () => base44.entities.COTemplate.list(),
  });

  const customerTrade = customer?.trade;
  const tradePresetName = customer?.trade_preset;
  const tradePreset = tradePresetName ? getTradePreset(tradePresetName) : null;
  const regionalRate = customer?.state ? getRegionalRate(customer.state, tradePresetName) : null;
  const regionalWage = customer?.base_hourly_wage ?? regionalRate;
  const effectiveDefaults = {
    ...userDefaults,
    default_overhead_percent: customer?.default_overhead_percent ?? userDefaults?.default_overhead_percent,
    default_markup_percent: customer?.default_markup_percent ?? userDefaults?.default_markup_percent,
    labor_burden_percent: customer?.labor_burden_percent ?? userDefaults?.labor_burden_percent,
    target_margin_percent: customer?.target_margin_percent ?? userDefaults?.target_margin_percent,
  };
  const sortedTemplates = customerTrade
    ? [...templates].sort((a, b) => {
        const aMatch = a.trade === customerTrade ? 0 : 1;
        const bMatch = b.trade === customerTrade ? 0 : 1;
        return aMatch - bMatch;
      })
    : templates;

  const [form, setForm] = useState({
    description: "",
    labor_hours: "",
    labor_rate: "",
    labor_burden_percent: "",
    estimated_labor_hours: "",
    actual_labor_hours: "",
    material_cost: "",
    baseline_material_cost: "",
    equipment_cost: "",
    subcontractor_cost: "",
    markup_percent: "",
    overhead_percent: "",
    tax_percent: "",
    payment_due_days: "",
    base_hourly_wage: regionalWage != null ? String(regionalWage) : "",
    payroll_tax_percent: "12",
    workers_comp_percent: customer?.workers_comp_percent != null ? String(customer.workers_comp_percent) : "8",
    general_liability_percent: "3",
    benefits_percent: "5",
    status: "draft",
    photos: [],
    ...initialData,
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const markupLocked = !canEditMarkup(currentUser);
  const canApprove = canApproveCO(currentUser);

  const calc = useMemo(
    () => calculateChangeOrder(form, effectiveDefaults, jobTargetMargin),
    [form, effectiveDefaults, jobTargetMargin]
  );

  const applyPreset = (presetId) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    setForm(prev => ({
      ...prev,
      labor_rate: preset.labor_rate ?? prev.labor_rate,
      labor_burden_percent: preset.labor_burden_percent ?? prev.labor_burden_percent,
      ...(canEditMarkup(currentUser) ? {
        markup_percent: preset.markup_percent ?? prev.markup_percent,
        overhead_percent: preset.overhead_percent ?? prev.overhead_percent,
      } : {}),
    }));
  };

  const applyTemplate = (templateId) => {
    const t = templates.find(t => t.id === templateId);
    if (!t) return;
    setForm(prev => ({
      ...prev,
      description: t.description || prev.description,
      labor_hours: t.labor_hours ?? prev.labor_hours,
      labor_rate: t.labor_rate ?? prev.labor_rate,
      labor_burden_percent: t.labor_burden_percent ?? prev.labor_burden_percent,
      material_cost: t.material_cost ?? prev.material_cost,
      equipment_cost: t.equipment_cost ?? prev.equipment_cost,
      subcontractor_cost: t.subcontractor_cost ?? prev.subcontractor_cost,
      ...(canEditMarkup(currentUser) ? {
        markup_percent: t.markup_percent ?? prev.markup_percent,
        overhead_percent: t.overhead_percent ?? prev.overhead_percent,
      } : {}),
      tax_percent: t.tax_percent ?? prev.tax_percent,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      labor_hours: parseFloat(form.labor_hours) || 0,
      labor_rate: parseFloat(form.labor_rate) || 0,
      labor_burden_percent: form.labor_burden_percent !== "" ? parseFloat(form.labor_burden_percent) : null,
      material_cost: parseFloat(form.material_cost) || 0,
      equipment_cost: parseFloat(form.equipment_cost) || 0,
      subcontractor_cost: parseFloat(form.subcontractor_cost) || 0,
      markup_percent: form.markup_percent !== "" ? parseFloat(form.markup_percent) : null,
      overhead_percent: form.overhead_percent !== "" ? parseFloat(form.overhead_percent) : null,
      tax_percent: parseFloat(form.tax_percent) || 0,
      base_hourly_wage: parseFloat(form.base_hourly_wage) || null,
      payroll_tax_percent: parseFloat(form.payroll_tax_percent) || 0,
      workers_comp_percent: parseFloat(form.workers_comp_percent) || 0,
      general_liability_percent: parseFloat(form.general_liability_percent) || 0,
      benefits_percent: parseFloat(form.benefits_percent) || 0,
      burden_amount_per_hour: calc.burden_calculated ? calc.burden_amount_per_hour : null,
      fully_loaded_rate: calc.burden_calculated ? calc.fully_loaded_rate : null,
      total_labor_burden_cost: calc.burden_calculated ? calc.total_labor_burden_cost : null,
      true_labor_cost: calc.true_labor_cost,
      subtotal_before_overhead: calc.subtotal_before_overhead,
      overhead_amount: calc.overhead_amount,
      total_cost: calc.total_cost,
      sell_price: calc.sell_price,
      tax_amount: calc.tax_amount,
      final_price_to_client: calc.final_price_to_client,
      true_margin_percent: calc.true_margin_percent,
      target_margin: calc.target_margin,
      target_sell_price: calc.target_sell_price,
      leakage_amount: calc.leakage_amount,
      estimated_labor_hours: parseFloat(form.estimated_labor_hours) || null,
      actual_labor_hours: parseFloat(form.actual_labor_hours) || null,
      baseline_material_cost: parseFloat(form.baseline_material_cost) || null,
      payment_due_days: parseFloat(form.payment_due_days) || null,
      photos: form.photos || [],
    };
    onSave(payload, calc.flags);
  };

  // Status options depend on role
  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    ...(canApprove ? [{ value: "approved", label: "Approved" }] : []),
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Inputs */}
      <form id="co-form" onSubmit={handleSubmit} className="space-y-5">
        {tradePresetName && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Trade Preset:</span>
            <span className="text-xs font-medium text-blue-600">{tradePresetName}</span>
            {tradePreset && (
              <span className="text-xs text-blue-400 ml-auto">
                OH {tradePreset.overhead}% · MU {tradePreset.material_markup}% · WC {tradePreset.workers_comp}% · Target {tradePreset.profit_target}%
              </span>
            )}
          </div>
        )}

        <div>
          <Label className="text-xs text-slate-500 uppercase tracking-wider">Description *</Label>
          <Textarea
            value={form.description}
            onChange={e => update("description", e.target.value)}
            placeholder="Describe the change order..."
            className="mt-1.5 min-h-[80px]"
            required
          />
        </div>

        <PhotoUploader value={form.photos} onChange={(photos) => update("photos", photos)} />

        <div className="flex gap-3">
          {presets.length > 0 && (
            <div className="flex-1">
              <Label className="text-xs text-slate-500 uppercase tracking-wider">Apply Cost Preset</Label>
              <MobileSelect
                placeholder="Select a preset..."
                onValueChange={applyPreset}
                triggerClassName="mt-1.5"
                options={presets.map(p => ({ value: p.id, label: p.preset_name }))}
              />
            </div>
          )}
          {sortedTemplates.length > 0 && (
            <div className="flex-1">
              <Label className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1"><Copy className="h-3 w-3" /> Apply Template</Label>
              <MobileSelect
                placeholder="Select a template..."
                onValueChange={applyTemplate}
                triggerClassName="mt-1.5"
                options={sortedTemplates.map(t => ({
                  value: t.id,
                  label: t.trade && customerTrade && t.trade !== customerTrade
                    ? `${t.template_name} (${t.trade})`
                    : t.template_name,
                }))}
              />
            </div>
          )}
        </div>

        <Section title="Labor">
          <NumInput label="Hours" value={form.labor_hours} onChange={v => update("labor_hours", v)} />
          <NumInput label="Rate ($/hr)" value={form.labor_rate} onChange={v => update("labor_rate", v)} prefix="$" />
          <NumInput label="Burden %" value={form.labor_burden_percent} onChange={v => update("labor_burden_percent", v)} suffix="%" placeholder={`Default: ${effectiveDefaults.labor_burden_percent ?? 25}%`} />
          <NumInput label="Est. Hours" value={form.estimated_labor_hours} onChange={v => update("estimated_labor_hours", v)} />
          <NumInput label="Actual Hours" value={form.actual_labor_hours} onChange={v => update("actual_labor_hours", v)} />
        </Section>

        <Section title="Labour Burden">
          <NumInput label="Base Hourly Wage" value={form.base_hourly_wage} onChange={v => update("base_hourly_wage", v)} prefix="$" />
          <NumInput label="Payroll Tax %" value={form.payroll_tax_percent} onChange={v => update("payroll_tax_percent", v)} suffix="%" placeholder="Default: 12%" />
          <NumInput label="Workers Comp %" value={form.workers_comp_percent} onChange={v => update("workers_comp_percent", v)} suffix="%" />
          <NumInput label="General Liability %" value={form.general_liability_percent} onChange={v => update("general_liability_percent", v)} suffix="%" placeholder="Default: 3%" />
          <NumInput label="Benefits %" value={form.benefits_percent} onChange={v => update("benefits_percent", v)} suffix="%" placeholder="Default: 5%" />
          <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
            <BurdenDisplay label="Burden Amount / Hr" value={calc.burden_calculated ? calc.burden_amount_per_hour : null} />
            <BurdenDisplay label="Fully Loaded Rate" value={calc.burden_calculated ? calc.fully_loaded_rate : null} />
            <BurdenDisplay label="Total Labour Burden" value={calc.burden_calculated ? calc.total_labor_burden_cost : null} />
          </div>
        </Section>

        <Section title="Costs">
          <NumInput label="Materials" value={form.material_cost} onChange={v => update("material_cost", v)} prefix="$" />
          <NumInput label="Baseline Material" value={form.baseline_material_cost} onChange={v => update("baseline_material_cost", v)} prefix="$" />
          <NumInput label="Equipment" value={form.equipment_cost} onChange={v => update("equipment_cost", v)} prefix="$" />
          <NumInput label="Subcontractor" value={form.subcontractor_cost} onChange={v => update("subcontractor_cost", v)} prefix="$" />
        </Section>

        <Section title={markupLocked ? "Rates (read-only)" : "Rates"}>
          <NumInput
            label="Markup %"
            value={markupLocked ? (form.markup_percent || userDefaults.default_markup_percent || 35) : form.markup_percent}
            onChange={markupLocked ? undefined : v => update("markup_percent", v)}
            suffix="%"
            placeholder={`Default: ${effectiveDefaults.default_markup_percent ?? 35}%`}
            disabled={markupLocked}
            lockIcon={markupLocked}
          />
          <NumInput
            label="Overhead %"
            value={markupLocked ? (form.overhead_percent || effectiveDefaults.default_overhead_percent || 10) : form.overhead_percent}
            onChange={markupLocked ? undefined : v => update("overhead_percent", v)}
            suffix="%"
            placeholder={`Default: ${effectiveDefaults.default_overhead_percent ?? 10}%`}
            disabled={markupLocked}
            lockIcon={markupLocked}
          />
          <NumInput label="Tax %" value={form.tax_percent} onChange={v => update("tax_percent", v)} suffix="%" />
          <NumInput label="Payment Due (days)" value={form.payment_due_days} onChange={v => update("payment_due_days", v)} />
        </Section>

        <div>
          <Label className="text-xs text-slate-500 uppercase tracking-wider">Status</Label>
          <MobileSelect
            value={form.status}
            onValueChange={v => update("status", v)}
            placeholder="Status"
            triggerClassName="mt-1.5 w-44"
            options={statusOptions}
          />
          {!canApprove && (
            <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
              <Lock className="h-3 w-3" /> Only Owners can approve
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-1.5" /> Cancel
            </Button>
          )}
          <Button type="submit" form="co-form" className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-1.5" /> Save
          </Button>
        </div>
      </form>

      {/* Right: Live calc */}
      <div className="lg:sticky lg:top-6 self-start">
        <LiveCalcPanel calc={calc} showFinancials={!isAdmin(currentUser)} />
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-3">{title}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{children}</div>
    </div>
  );
}

function BurdenDisplay({ label, value }) {
  return (
    <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-700">
        {value != null ? `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
      </p>
    </div>
  );
}

function NumInput({ label, value, onChange, prefix, suffix, placeholder, disabled, lockIcon }) {
  return (
    <div>
      <Label className="text-xs text-slate-400 flex items-center gap-1">
        {label}
        {lockIcon && <Lock className="h-3 w-3 text-slate-300" />}
      </Label>
      <div className="relative mt-1">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{prefix}</span>}
        <Input
          type="number"
          step="any"
          value={value}
          onChange={onChange ? e => onChange(e.target.value) : undefined}
          placeholder={placeholder || "0"}
          disabled={disabled}
          className={`${prefix ? "pl-6" : ""} ${suffix ? "pr-8" : ""} ${disabled ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""}`}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{suffix}</span>}
      </div>
    </div>
  );
}