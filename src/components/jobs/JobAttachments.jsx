import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Paperclip, Trash2, Image, FileText, File, ExternalLink, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const CATEGORIES = ["Photo", "Document", "Contract", "Other"];

const FILE_ICON = {
  "image/jpeg": Image, "image/png": Image, "image/gif": Image, "image/webp": Image, "image/avif": Image,
  "application/pdf": FileText,
};

const isImage = (type) => type?.startsWith("image/");

export default function JobAttachments({ jobId, changeOrderId }) {
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState("Photo");
  const [editingNotes, setEditingNotes] = useState(null);
  const [notesValue, setNotesValue] = useState("");
  const fileRef = useRef();
  const queryClient = useQueryClient();

  const queryKey = changeOrderId ? ["attachments", "co", changeOrderId] : ["attachments", jobId];

  const { data: attachments = [] } = useQuery({
    queryKey,
    queryFn: () => {
      if (changeOrderId) return base44.entities.JobAttachment.filter({ change_order_id: changeOrderId }, "-created_date");
      return base44.entities.JobAttachment.filter({ job_id: jobId }, "-created_date");
    },
    enabled: !!(changeOrderId || jobId),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.JobAttachment.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); toast.success("Attachment removed"); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.JobAttachment.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); setEditingNotes(null); toast.success("Notes saved"); },
  });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.JobAttachment.create({
        job_id: jobId,
        change_order_id: changeOrderId || undefined,
        file_name: file.name,
        file_url,
        file_type: file.type,
        category,
      });
      queryClient.invalidateQueries({ queryKey });
      toast.success("File uploaded");
    } catch {
      toast.error("Upload failed");
    }
    setUploading(false);
    e.target.value = "";
  };

  const IconFor = (type) => FILE_ICON[type] || File;

  const startEditNotes = (att) => {
    setEditingNotes(att.id);
    setNotesValue(att.notes || "");
  };

  const saveNotes = (att) => {
    updateMutation.mutate({ id: att.id, data: { notes: notesValue } });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900">Attachments ({attachments.length})</h3>
        </div>
        <div className="flex items-center gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-7 text-xs w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Uploading..." : "Upload"}
          </Button>
          <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
        </div>
      </div>

      {attachments.length === 0 ? (
        <div
          className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center cursor-pointer hover:border-blue-300 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Click to upload photos, contracts, documents…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {attachments.map(att => {
            const Icon = IconFor(att.file_type);
            const img = isImage(att.file_type);
            return (
              <div key={att.id} className="flex gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors group">
                {/* Thumbnail / Icon */}
                <div className="flex-shrink-0">
                  {img ? (
                    <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="block">
                      <img
                        src={att.file_url}
                        alt={att.file_name}
                        className="h-14 w-14 rounded-lg object-cover border border-slate-200"
                        onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                      />
                      <div className="hidden h-14 w-14 rounded-lg bg-slate-100 items-center justify-center">
                        <Image className="h-5 w-5 text-slate-400" />
                      </div>
                    </a>
                  ) : (
                    <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="block h-14 w-14 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-slate-500" />
                    </a>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-800 truncate hover:text-blue-600 block flex-1 min-w-0" title={att.file_name}>
                      {att.file_name}
                    </a>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <a href={att.file_url} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-red-500" onClick={() => deleteMutation.mutate(att.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                      att.category === "Photo" ? "bg-blue-50 text-blue-600" :
                      att.category === "Contract" ? "bg-purple-50 text-purple-600" :
                      att.category === "Document" ? "bg-amber-50 text-amber-600" :
                      "bg-slate-100 text-slate-500"
                    )}>
                      {att.category || "Other"}
                    </span>
                    {att.created_date && (
                      <span className="text-[10px] text-slate-400">{format(new Date(att.created_date), "MMM d, yyyy")}</span>
                    )}
                  </div>

                  {/* Notes */}
                  {editingNotes === att.id ? (
                    <div className="mt-1.5 flex items-start gap-1">
                      <textarea
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
                        rows={2}
                        placeholder="Add notes..."
                        autoFocus
                      />
                      <div className="flex flex-col gap-0.5">
                        <Button size="icon" variant="ghost" className="h-5 w-5 text-emerald-600" onClick={() => saveNotes(att)} disabled={updateMutation.isPending}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-5 w-5 text-slate-400" onClick={() => setEditingNotes(null)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditNotes(att)}
                      className="mt-1 text-xs text-left text-slate-500 hover:text-blue-600 flex items-start gap-1 w-full"
                    >
                      {att.notes ? (
                        <span className="line-clamp-2">{att.notes}</span>
                      ) : (
                        <span className="italic text-slate-400 flex items-center gap-0.5"><Pencil className="h-2.5 w-2.5" /> Add notes</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}