import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCustomerAuth } from "@/lib/CustomerAuthContext";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Save, Check, TrendingUp, TrendingDown, Calendar, DollarSign, Target } from "lucide-react";
import { toast } from "sonner";
import { calculateJobMargins } from "@/components/changeorders/CalculationEngine";

const OVERHEAD_FIELDS = [
  { key: "be_rent_office", label: "Rent / Office" },
  { key: "be_vehicle_equipment", label: "Vehicle / Equipment" },
  { key: "be_insurance", label: "Insurance" },
  { key: "be_software_tools", label: "Software / Tools" },
  { key: "be_phone_utilities", label: "Phone / Utilities" },
  { key: "be_marketing", label: "Marketing" },
  { key: "be_salaries_non_field", label: "Salaries (non-field staff)" },
  { key: "be_other", label: "Other" },
];

export default function BreakEvenAnalysis() {
  const { customer, refreshCustomer } = useCustomerAuth();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list(),
  });
  const { data: changeOrders = [] } = useQuery({
    queryKey: ["changeOrders"],
    queryFn: () => base44.entities.ChangeOrder.list(),
  });

  useEffect(() => {
    if (customer) {
      const init = {};
      OVERHEAD_FIELDS.forEach(f => {
        init[f.key] = customer[f.key] ?? "";
      });
      init.be_gross_margin_percent = customer.be_gross_margin_percent ?? customer.target_margin_percent ?? 20;
      init.be_avg_job_value = customer.be_avg_job_value ?? "";
      setForm(init);
    }
  }, [customer]);

  const overheadValues = OVERHEAD_FIELDS.map(f => parseFloat(form[f.key]) || 0);
  const totalOverhead = overheadValues.reduce((s, v) => s + v, 0);
  const grossMargin = parseFloat(form.be_gross_margin_percent) || 0;
  const avgJobValue = parseFloat(form.be_avg_job_value) || 0;

  const monthlyBreakEven = grossMargin > 0 ? totalOverhead / (grossMargin / 100) : 0;
  const weeklyTarget = monthlyBreakEven / 4.33;
  const dailyTarget = monthlyBreakEven / 21.7;
  const jobsNeeded = avgJobValue > 0 ? monthlyBreakEven / avgJobValue : 0;

  // Current month revenue from active jobs
  const now = new Date();
  const activeJobs = jobs.filter(j => j.status === "active");
  const currentMonthRevenue = activeJobs.reduce((s, job) => {
    const jobCOs = changeOrders.filter(co => co.job_id === job.id);
    const margins = calculateJobMargins(job, jobCOs);
    const coRevenue = jobCOs.filter(co => co.status === "approved").reduce((s2, co) => s2 + (co.final_price_to_client || 0), 0);
    const start = job.start_date ? new Date(job.start_date) : null;
    if (start && start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear()) {
      return s + (job.contract_value || 0) + coRevenue;
    }
    return s + coRevenue;
  }, 0);

  const onTrack = currentMonthRevenue >= monthlyBreakEven && monthlyBreakEven > 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      const session_token = localStorage.getItem('cps_session_token');
      const payload = { session_token };
      OVERHEAD_FIELDS.forEach(f => {
        payload[f.key] = parseFloat(form[f.key]) || 0;
      });
      payload.be_gross_margin_percent = parseFloat(form.be_gross_margin_percent) || 0;
      payload.be_avg_job_value = parseFloat(form.be_avg_job_value) || null;
      await base44.functions.invoke('updateCustomerSettings', payload);
      await refreshCustomer();
      setSaved(true);
      toast.success("Break-even settings saved");
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const $ = (n) => `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Break-Even Analysis</h1>
        <p className="text-sm text-muted-foreground mt-1">Know exactly how much revenue you need to cover your overhead each month.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overhead inputs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Fixed Costs</CardTitle>
            <CardDescription>Enter your recurring monthly overhead expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {OVERHEAD_FIELDS.map(f => (
                <div key={f.key}>
                  <Label className="text-xs text-slate-500">{f.label} ($)</Label>
                  <Input
                    type="number" step="0.01"
                    value={form[f.key] ?? ""}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-700">Total Monthly Overhead</span>
              <span className="text-xl font-bold text-slate-900">{$(totalOverhead)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Margin and results */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Break-Even Targets</CardTitle>
              <CardDescription>Based on your overhead and margin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-500">Gross Margin %</Label>
                  <Input
                    type="number" step="0.01"
                    value={form.be_gross_margin_percent ?? ""}
                    onChange={e => setForm(p => ({ ...p, be_gross_margin_percent: e.target.value }))}
                    className="mt-1"
                    placeholder="20"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Average Job Value ($)</Label>
                  <Input
                    type="number" step="0.01"
                    value={form.be_avg_job_value ?? ""}
                    onChange={e => setForm(p => ({ ...p, be_avg_job_value: e.target.value }))}
                    className="mt-1"
                    placeholder="e.g. 15000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                <ResultCard icon={Target} label="Monthly Revenue Needed" value={$(monthlyBreakEven)} highlight />
                <div className="grid grid-cols-2 gap-3">
                  <ResultCard icon={Calendar} label="Weekly Target" value={$(weeklyTarget)} />
                  <ResultCard icon={Calendar} label="Daily Target" value={$(dailyTarget)} />
                </div>
                {jobsNeeded > 0 && (
                  <ResultCard icon={DollarSign} label="Average Jobs Needed / Month" value={jobsNeeded.toFixed(1)} />
                )}
              </div>
            </CardContent>
          </Card>

          {/* On-track indicator */}
          {monthlyBreakEven > 0 && (
            <Card className={onTrack ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  {onTrack ? (
                    <TrendingUp className="h-8 w-8 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-red-500" />
                  )}
                  <div>
                    <p className={`text-sm font-bold ${onTrack ? "text-emerald-700" : "text-red-700"}`}>
                      {onTrack ? "On Track" : "Behind Target"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Current month revenue: <strong>{$(currentMonthRevenue)}</strong> / Target: <strong>{$(monthlyBreakEven)}</strong>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 min-w-[140px]">
          {saved ? <><Check className="h-4 w-4 mr-1.5" /> Saved</> : saving ? "Saving..." : <><Save className="h-4 w-4 mr-1.5" /> Save Settings</>}
        </Button>
      </div>
    </div>
  );
}

function ResultCard({ icon: Icon, label, value, highlight }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${highlight ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200"}`}>
      <Icon className={`h-5 w-5 ${highlight ? "text-blue-500" : "text-slate-400"}`} />
      <div className="flex-1">
        <p className="text-xs text-slate-500">{label}</p>
        <p className={`text-lg font-bold ${highlight ? "text-blue-700" : "text-slate-900"}`}>{value}</p>
      </div>
    </div>
  );
}