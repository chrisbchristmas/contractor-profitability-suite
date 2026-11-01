import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCustomerAuth } from "@/lib/CustomerAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Save, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import MobileSelect from "@/components/ui/MobileSelect";
import { TRADES } from "@/lib/trades";
import { TRADE_PRESET_OPTIONS, getTradePreset } from "@/lib/tradePresets";
import { US_STATES, getRegionalRate } from "@/lib/regionalRates";

export default function Settings() {
  const { customer: user, isLoading, refreshCustomer } = useCustomerAuth();
  const [form, setForm] = useState({
    company_name: "",
    phone: "",
    trade: "",
    trade_preset: "",
    state: "",
    target_margin_percent: 30,
    labor_burden_percent: 35,
    payroll_tax_percent: 12,
    workers_comp_percent: 8,
    general_liability_percent: 3,
    benefits_percent: 5,
    default_markup_percent: 35,
    default_overhead_percent: 10,
    annual_profit_goal: "",
    base_hourly_wage: "",
    variance_alert_threshold_percent: 8,
  });
  const [showBurdenBreakdown, setShowBurdenBreakdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        company_name: user.company_name || "",
        phone: user.phone || "",
        trade: user.trade || "",
        trade_preset: user.trade_preset || "",
        state: user.state || "",
        target_margin_percent: user.target_margin_percent ?? 30,
        labor_burden_percent: user.labor_burden_percent ?? 35,
        payroll_tax_percent: user.payroll_tax_percent ?? 12,
        workers_comp_percent: user.workers_comp_percent ?? 8,
        general_liability_percent: user.general_liability_percent ?? 3,
        benefits_percent: user.benefits_percent ?? 5,
        default_markup_percent: user.default_markup_percent ?? 35,
        default_overhead_percent: user.default_overhead_percent ?? 10,
        annual_profit_goal: user.annual_profit_goal || "",
        base_hourly_wage: user.base_hourly_wage || "",
        variance_alert_threshold_percent: user.variance_alert_threshold_percent ?? 8,
      });
    }
  }, [user]);

  const burdenBreakdownSum =
    (parseFloat(form.payroll_tax_percent) || 0) +
    (parseFloat(form.workers_comp_percent) || 0) +
    (parseFloat(form.general_liability_percent) || 0) +
    (parseFloat(form.benefits_percent) || 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      const session_token = localStorage.getItem('cps_session_token');
      await base44.functions.invoke('updateCustomerSettings', {
        session_token,
        company_name: form.company_name,
        phone: form.phone,
        trade: form.trade || null,
        trade_preset: form.trade_preset || null,
        state: form.state || null,
        workers_comp_percent: parseFloat(form.workers_comp_percent) || 8,
        target_margin_percent: parseFloat(form.target_margin_percent) || 30,
        labor_burden_percent: parseFloat(form.labor_burden_percent) || 35,
        payroll_tax_percent: parseFloat(form.payroll_tax_percent) || 12,
        general_liability_percent: parseFloat(form.general_liability_percent) || 3,
        benefits_percent: parseFloat(form.benefits_percent) || 5,
        default_markup_percent: parseFloat(form.default_markup_percent) || 35,
        default_overhead_percent: parseFloat(form.default_overhead_percent) || 10,
        annual_profit_goal: parseFloat(form.annual_profit_goal) || null,
        base_hourly_wage: parseFloat(form.base_hourly_wage) || null,
        variance_alert_threshold_percent: parseFloat(form.variance_alert_threshold_percent) || 8,
      });
      await refreshCustomer();
      setSaved(true);
      toast.success("Settings saved");
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!user) return <div className="p-8 text-center text-muted-foreground">Please log in to view settings.</div>;

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your defaults and company info</p>
      </div>

      <div className="space-y-6">
        {/* Company info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Company Info</CardTitle>
            <CardDescription>Basic information about your business</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-slate-500">Full Name</Label>
              <Input value={user.full_name || ""} disabled className="mt-1 bg-muted" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Email</Label>
              <Input value={user.email || ""} disabled className="mt-1 bg-muted" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Company Name</Label>
              <Input value={form.company_name} onChange={e => setForm(p => ({...p, company_name: e.target.value}))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Phone</Label>
              <Input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Primary Trade</Label>
              <MobileSelect
                value={form.trade}
                onValueChange={v => setForm(p => ({...p, trade: v}))}
                placeholder="Select your trade..."
                triggerClassName="mt-1 w-full"
                options={TRADES.map(t => ({ value: t, label: t }))}
              />
              <p className="text-xs text-slate-400 mt-1">Used to show relevant CO templates first when creating change orders.</p>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Trade Preset</Label>
              <MobileSelect
                value={form.trade_preset}
                onValueChange={(v) => {
                  const preset = getTradePreset(v);
                  if (preset) {
                    setForm(p => ({
                      ...p,
                      trade_preset: v,
                      default_overhead_percent: preset.overhead,
                      default_markup_percent: preset.material_markup,
                      workers_comp_percent: preset.workers_comp,
                      target_margin_percent: preset.profit_target,
                    }));
                  } else {
                    setForm(p => ({ ...p, trade_preset: v }));
                  }
                }}
                placeholder="Select a trade preset..."
                triggerClassName="mt-1 w-full"
                options={TRADE_PRESET_OPTIONS.map(t => ({ value: t, label: t }))}
              />
              <p className="text-xs text-slate-400 mt-1">Pre-fills overhead, material markup, workers comp, and profit target defaults. You can override any value below.</p>
            </div>
            <div>
              <Label className="text-xs text-slate-500">State (for Regional Labour Rate Defaults)</Label>
              <MobileSelect
                value={form.state}
                onValueChange={(v) => {
                  const regionalRate = getRegionalRate(v, form.trade_preset);
                  setForm(p => ({
                    ...p,
                    state: v,
                    ...(regionalRate != null ? { base_hourly_wage: String(regionalRate) } : {}),
                  }));
                }}
                placeholder="Select your state..."
                triggerClassName="mt-1 w-full"
                options={US_STATES.map(s => ({ value: s.code, label: `${s.code} — ${s.name}` }))}
              />
              <p className="text-xs text-slate-400 mt-1">Selecting your state pre-fills the base hourly wage below with the typical loaded rate for your trade in your region. You can override it.</p>
            </div>
          </CardContent>
        </Card>

        {/* Calculation defaults */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Calculation Defaults</CardTitle>
            <CardDescription>These values are used when creating new change orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-slate-500">Target Margin %</Label>
                <Input
                  type="number" step="0.01"
                  value={form.target_margin_percent}
                  onChange={e => setForm(p => ({...p, target_margin_percent: e.target.value}))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Variance Alert Threshold %</Label>
                <Input
                  type="number" step="0.01"
                  value={form.variance_alert_threshold_percent}
                  onChange={e => setForm(p => ({...p, variance_alert_threshold_percent: e.target.value}))}
                  className="mt-1"
                />
                <p className="text-xs text-slate-400 mt-1">Fire a category alert when actual cost exceeds estimate by this % (default 8%).</p>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Default Markup %</Label>
                <Input
                  type="number" step="0.01"
                  value={form.default_markup_percent}
                  onChange={e => setForm(p => ({...p, default_markup_percent: e.target.value}))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Default Overhead %</Label>
                <Input
                  type="number" step="0.01"
                  value={form.default_overhead_percent}
                  onChange={e => setForm(p => ({...p, default_overhead_percent: e.target.value}))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Workers Comp %</Label>
                <Input
                  type="number" step="0.01"
                  value={form.workers_comp_percent}
                  onChange={e => setForm(p => ({...p, workers_comp_percent: e.target.value}))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Annual Profit Goal ($)</Label>
                <Input
                  type="number" step="1"
                  value={form.annual_profit_goal}
                  onChange={e => setForm(p => ({...p, annual_profit_goal: e.target.value}))}
                  placeholder="e.g. 300000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Base Hourly Wage ($/hr)</Label>
                <Input
                  type="number" step="0.01"
                  value={form.base_hourly_wage}
                  onChange={e => setForm(p => ({...p, base_hourly_wage: e.target.value}))}
                  placeholder="e.g. 75"
                  className="mt-1"
                />
                {form.state && form.trade_preset && getRegionalRate(form.state, form.trade_preset) != null && (
                  <p className="text-xs text-blue-500 mt-1">Regional default for {form.trade_preset} in {form.state}: ${getRegionalRate(form.state, form.trade_preset)}/hr</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Labor Burden */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Labor Burden</CardTitle>
            <CardDescription>
              Applied everywhere labor cost is computed from hours (time tracking, crew costs, job costing). Per-job overrides available on each job.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-slate-500">Total Labor Burden %</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number" step="0.01"
                  value={form.labor_burden_percent}
                  onChange={e => setForm(p => ({...p, labor_burden_percent: e.target.value}))}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => setShowBurdenBreakdown(s => !s)}>
                  {showBurdenBreakdown ? "Hide" : "Breakdown"}
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Burdened rate = wage × (1 + burden%). Default 35%.
              </p>
            </div>
            {showBurdenBreakdown && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Burden Breakdown</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-500">Payroll Taxes %</Label>
                    <Input type="number" step="0.01" value={form.payroll_tax_percent} onChange={e => setForm(p => ({...p, payroll_tax_percent: e.target.value}))} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Workers Comp %</Label>
                    <Input type="number" step="0.01" value={form.workers_comp_percent} onChange={e => setForm(p => ({...p, workers_comp_percent: e.target.value}))} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">General Liability %</Label>
                    <Input type="number" step="0.01" value={form.general_liability_percent} onChange={e => setForm(p => ({...p, general_liability_percent: e.target.value}))} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Benefits %</Label>
                    <Input type="number" step="0.01" value={form.benefits_percent} onChange={e => setForm(p => ({...p, benefits_percent: e.target.value}))} className="mt-1" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-500">Breakdown sum</span>
                  <span className={cn("text-sm font-bold", Math.abs(burdenBreakdownSum - (parseFloat(form.labor_burden_percent) || 0)) < 0.01 ? "text-emerald-600" : "text-amber-600")}>
                    {burdenBreakdownSum.toFixed(2)}%
                  </span>
                </div>
                <Button
                  type="button" variant="outline" size="sm"
                  onClick={() => setForm(p => ({...p, labor_burden_percent: burdenBreakdownSum.toFixed(2)}))}
                >
                  Set total = breakdown sum
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 min-w-[140px]">
            {saved ? <><Check className="h-4 w-4 mr-1.5" /> Saved</> : saving ? "Saving..." : <><Save className="h-4 w-4 mr-1.5" /> Save Settings</>}
          </Button>
        </div>

        {/* Account Deletion */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-base text-red-600">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions for your account</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete My Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your account and all associated data including jobs, change orders, invoices, and time entries. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-2">
                  <Label className="text-xs text-slate-500">Re-enter your password to confirm</Label>
                  <Input
                    type="password"
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    placeholder="Your password"
                    className="mt-1"
                    autoFocus
                  />
                  {deleteError && <p className="text-xs text-red-600 mt-1">{deleteError}</p>}
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => { setDeletePassword(""); setDeleteError(""); }}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    disabled={deleting || !deletePassword}
                    onClick={async (e) => {
                      e.preventDefault();
                      if (!deletePassword) return;
                      setDeleting(true);
                      setDeleteError("");
                      try {
                        const session_token = localStorage.getItem('cps_session_token');
                        const resp = await base44.functions.invoke('deleteCustomerAccount', { session_token, password: deletePassword });
                        if (resp.data?.error) {
                          setDeleteError(resp.data.error);
                          setDeleting(false);
                          return;
                        }
                        toast.success("Account deleted. Any active subscriptions or trials have been cancelled.");
                        localStorage.removeItem('cps_session_token');
                        window.location.href = '/login';
                      } catch (err) {
                        setDeleteError("Failed to delete account. Please try again.");
                        setDeleting(false);
                      }
                    }}
                  >
                    {deleting ? "Deleting..." : "Yes, delete my account"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}