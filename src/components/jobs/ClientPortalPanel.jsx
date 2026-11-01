import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Share2, Copy, RefreshCw, Link2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function ClientPortalPanel({ job, jobId }) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState(job.client_notes || "");

  const shareUrl = job.share_token
    ? `${window.location.origin}/share/${job.share_token}`
    : "";

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Job.update(jobId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
    },
  });

  const handleGenerate = () => {
    const token = crypto.randomUUID();
    updateMutation.mutate(
      { share_token: token },
      { onSuccess: () => toast.success("Share link generated!") }
    );
  };

  const handleRegenerate = () => {
    const token = crypto.randomUUID();
    updateMutation.mutate(
      { share_token: token },
      { onSuccess: () => toast.success("New link generated — old link is now invalid.") }
    );
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard?.writeText(shareUrl).then(
      () => toast.success("Link copied to clipboard!"),
      () => toast.error("Failed to copy link.")
    );
  };

  const handleToggle = (field, value) => {
    updateMutation.mutate({ [field]: value });
  };

  const handleSaveNotes = () => {
    updateMutation.mutate(
      { client_notes: notes },
      { onSuccess: () => toast.success("Client notes saved.") }
    );
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Share2 className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Client Portal
        </h2>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Visibility Toggles */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Client Visibility</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {job.show_contract_value ? <Eye className="h-3.5 w-3.5 text-emerald-500" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                <span className="text-sm">Show Contract Value</span>
              </div>
              <Switch
                checked={job.show_contract_value || false}
                onCheckedChange={(v) => handleToggle("show_contract_value", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {job.show_co_details ? <Eye className="h-3.5 w-3.5 text-emerald-500" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                <span className="text-sm">Show Change Order Details</span>
              </div>
              <Switch
                checked={job.show_co_details || false}
                onCheckedChange={(v) => handleToggle("show_co_details", v)}
              />
            </div>
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Margin and profit information is never shared with the client.
            </p>
          </div>

          {/* Client Notes */}
          <div>
            <Label className="text-xs text-slate-500">Client Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1"
              placeholder="Add notes for your client to see on the shared portal..."
            />
            <Button size="sm" variant="outline" className="mt-2" onClick={handleSaveNotes} disabled={updateMutation.isPending}>
              Save Notes
            </Button>
          </div>

          {/* Share Link */}
          <div className="border-t pt-4">
            {shareUrl ? (
              <div className="space-y-2">
                <Label className="text-xs text-slate-500">Shareable Link</Label>
                <div className="flex gap-2">
                  <Input readOnly value={shareUrl} className="text-xs" />
                  <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0">
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                  </Button>
                </div>
                <Button size="sm" variant="outline" onClick={handleRegenerate} disabled={updateMutation.isPending}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Regenerate Token
                </Button>
                <p className="text-xs text-muted-foreground">Regenerating creates a new link and invalidates the old one.</p>
              </div>
            ) : (
              <Button onClick={handleGenerate} disabled={updateMutation.isPending}>
                <Link2 className="h-4 w-4 mr-1.5" /> Generate Share Link
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}