import { supabase } from "@/api/supabaseClient";

export async function logAudit({ recordType, recordId, action, fieldChanged, oldValue, newValue, user, description }) {
  try {
    // Plain insert, no .select(): audit_log is admin-read-only, so a read-back makes RLS reject owner/PM inserts.
    const { error } = await supabase.from("audit_log").insert({
      record_type: recordType,
      record_id: recordId,
      action,
      field_changed: fieldChanged || null,
      old_value: oldValue != null ? String(oldValue) : null,
      new_value: newValue != null ? String(newValue) : null,
      changed_by: user?.id, // audit_log.changed_by is a uuid column
      changed_by_name: user?.full_name || "",
      changed_by_role: user?.role || "",
      description: description || `${action} on ${recordType}`,
    });
    if (error) console.warn("audit log failed:", error.message);
  } catch (_) {
    // Audit failures should never block main flow
  }
}