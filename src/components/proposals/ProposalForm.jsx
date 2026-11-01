import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Loader2, Copy, Save, RotateCcw, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import ProposalOutput from "./ProposalOutput";

const JOB_TYPES = [
  "Roof replacement", "HVAC install", "Kitchen remodel", "Bathroom renovation",
  "Electrical panel upgrade", "Plumbing repair", "Flooring installation",
  "Painting (interior)", "Painting (exterior)", "Deck/patio construction",
  "Window replacement", "Door installation", "Landscaping", "Concrete work", "Other",
];

export default function ProposalForm({ user, monthlyCount, prefillData, onSaved, onBack }) {
  const [form, setForm] = useState({
    client_name: "", client_email: "", client_address: "",
    job_type: "", job_type_custom: "", scope_description: "",
    timeline: "", contract_value: "",
    payment_terms: "50% deposit required to schedule, 50% due on completion",
    warranty_terms: "1-year labor warranty on all work performed",
    special_notes: "", tone: "professional",
    contractor_company: user?.company_name || "",
    contractor_license: user?.license_number || "",
    contractor_phone: user?.phone || "",
    contractor_email: user?.email || "",
    linked_job_id: "",
  });
  const [jobs, setJobs] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [customJobType, setCustomJobType] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    base44.entities.Job.list("-created_date", 50).then(setJobs).catch(() => {});
    if (prefillData) {
      setForm(f => ({
        ...f,
        client_name: prefillData.client_name || "",
        client_email: prefillData.client_email || "",
        client_address: prefillData.client_address || "",
        job_type: prefillData.job_type || "",
        scope_description: prefillData.scope_description || "",
        timeline: prefillData.timeline || "",
        contract_value: prefillData.contract_value || "",
        payment_terms: prefillData.payment_terms || f.payment_terms,
        warranty_terms: prefillData.warranty_terms || f.warranty_terms,
        special_notes: prefillData.special_notes || "",
        tone: prefillData.tone || "professional",
        contractor_company: prefillData.contractor_company || user?.company_name || "",
        contractor_license: prefillData.contractor_license || user?.license_number || "",
        contractor_phone: prefillData.contractor_phone || user?.phone || "",
        contractor_email: prefillData.contractor_email || user?.email || "",
      }));
      if (!JOB_TYPES.includes(prefillData.job_type) && prefillData.job_type) {
        setCustomJobType(true);
      }
    }
  }, [prefillData]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleJobLink = (jobId) => {
    set("linked_job_id", jobId);
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      set("client_name", job.client_name || form.client_name);
      set("contract_value", job.contract_value || form.contract_value);
    }
  };

  const handleJobTypeChange = (val) => {
    if (val === "Other") {
      setCustomJobType(true);
      set("job_type", "");
    } else {
      setCustomJobType(false);
      set("job_type", val);
    }
  };

  const isTrial = user?.subscription_status === "trial";

  const handleGenerate = async () => {
    if (isTrial && monthlyCount >= 3) {
      setShowUpgradeModal(true);
      return;
    }
    if (!form.client_name || !form.scope_description || !form.contract_value || (!form.job_type && !form.job_type_custom)) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const finalJobType = customJobType ? form.job_type_custom : form.job_type;
    setGenerating(true);
    const session_token = localStorage.getItem("cps_session_token");
    const res = await base44.functions.invoke("generateProposal", {
      session_token,
      form: { ...form, job_type: finalJobType },
    });
    setGenerating(false);
    if (res.data?.proposal_content) {
      setGeneratedContent(res.data.proposal_content);
    } else {
      toast.error("Failed to generate proposal. Please try again.");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const currentMonth = new Date().toISOString().slice(0, 7);
    const finalJobType = customJobType ? form.job_type_custom : form.job_type;
    await base44.entities.Proposal.create({
      user_id: user.id,
      client_name: form.client_name,
      client_email: form.client_email,
      client_address: form.client_address,
      job_type: finalJobType,
      scope_description: form.scope_description,
      timeline: form.timeline,
      contract_value: parseFloat(form.contract_value) || 0,
      payment_terms: form.payment_terms,
      warranty_terms: form.warranty_terms,
      special_notes: form.special_notes,
      tone: form.tone,
      contractor_company: form.contractor_company,
      contractor_license: form.contractor_license,
      contractor_phone: form.contractor_phone,
      contractor_email: form.contractor_email,
      proposal_content: generatedContent,
      status: "draft",
      month_generated: currentMonth,
      job_id: form.linked_job_id || null,
    });
    setSaving(false);
    toast.success("Proposal saved!");
    onSaved();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Proposals
      </button>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">New Proposal</h1>

      {!generatedContent ? (
        <div className="space-y-6">
          {/* Client Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Client Info</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-slate-500">Client Name <span className="text-red-500">*</span></Label>
                <Input value={form.client_name} onChange={e => set("client_name", e.target.value)} className="mt-1" placeholder="Jane Smith" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Client Email</Label>
                <Input value={form.client_email} onChange={e => set("client_email", e.target.value)} className="mt-1" placeholder="jane@example.com" />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs text-slate-500">Project Address</Label>
                <Input value={form.client_address} onChange={e => set("client_address", e.target.value)} className="mt-1" placeholder="123 Main St, City, State" />
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Job Details</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-slate-500">Job Type <span className="text-red-500">*</span></Label>
                <Select onValueChange={handleJobTypeChange} value={customJobType ? "Other" : form.job_type}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select job type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                {customJobType && (
                  <Input value={form.job_type_custom} onChange={e => set("job_type_custom", e.target.value)} className="mt-2" placeholder="Describe the job type..." />
                )}
              </div>
              <div>
                <Label className="text-xs text-slate-500">Scope of Work <span className="text-red-500">*</span></Label>
                <p className="text-xs text-slate-400 mb-1">Describe what the job includes. The more detail you add, the better the proposal.</p>
                <Textarea value={form.scope_description} onChange={e => set("scope_description", e.target.value)} className="mt-1 h-28" placeholder="e.g. Remove and replace 2,400 sq ft of shingles, install new underlayment, replace 6 pieces of damaged fascia board..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Contract Value ($) <span className="text-red-500">*</span></Label>
                  <Input type="number" value={form.contract_value} onChange={e => set("contract_value", e.target.value)} className="mt-1" placeholder="0" />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Project Timeline</Label>
                  <Input value={form.timeline} onChange={e => set("timeline", e.target.value)} className="mt-1" placeholder="e.g. 2 weeks, starting June 15" />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Payment Terms</Label>
                  <Input value={form.payment_terms} onChange={e => set("payment_terms", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Warranty Terms</Label>
                  <Input value={form.warranty_terms} onChange={e => set("warranty_terms", e.target.value)} className="mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Special Notes / Inclusions / Exclusions</Label>
                <Textarea value={form.special_notes} onChange={e => set("special_notes", e.target.value)} className="mt-1 h-20" placeholder="Any exclusions, special conditions, or additional notes..." />
              </div>
            </div>
          </div>

          {/* Proposal Style */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Proposal Style</h2>
            <div className="flex gap-3">
              {["professional", "friendly", "formal"].map(t => (
                <button
                  key={t}
                  onClick={() => set("tone", t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                    form.tone === t ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                  }`}
                >{t}</button>
              ))}
            </div>
          </div>

          {/* Link to Job */}
          {jobs.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Link to Existing Job (Optional)</h2>
              <Select onValueChange={handleJobLink} value={form.linked_job_id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a job to pre-fill data..." />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.job_name} — {j.client_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Contractor Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Your Contractor Info</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-slate-500">Company Name</Label>
                <Input value={form.contractor_company} onChange={e => set("contractor_company", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">License Number</Label>
                <Input value={form.contractor_license} onChange={e => set("contractor_license", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Phone</Label>
                <Input value={form.contractor_phone} onChange={e => set("contractor_phone", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Email</Label>
                <Input value={form.contractor_email} onChange={e => set("contractor_email", e.target.value)} className="mt-1" />
              </div>
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={generating} className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-semibold">
            {generating ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Generating your proposal...</>
            ) : "Generate Proposal"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <ProposalOutput content={generatedContent} />
          <div className="flex gap-3 flex-wrap">
            <Button onClick={handleCopy} variant="outline" className="gap-2">
              {copied ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy to Clipboard</>}
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Proposal"}
            </Button>
            <Button onClick={() => setGeneratedContent(null)} variant="ghost" className="gap-2">
              <RotateCcw className="h-4 w-4" /> Start Over
            </Button>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Free Proposal Limit Reached</DialogTitle>
            <DialogDescription>
              You've used all 3 free proposals this month. Upgrade to Pro for unlimited AI proposals plus full job costing, invoicing, and profit tracking.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Link to="/Billing" className="flex-1">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Upgrade Now</Button>
            </Link>
            <Button variant="outline" onClick={() => setShowUpgradeModal(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}