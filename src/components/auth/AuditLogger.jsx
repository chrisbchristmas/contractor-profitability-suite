import { base44 } from "@/api/base44Client";

export async function logAudit({ recordType, recordId, action, fieldChanged, oldValue, newValue, user, description }) {
  try {
    await base44.entities.AuditLog.create({
      record_type: recordType,
      record_id: recordId,
      action,
      field_changed: fieldChanged || null,
      old_value: oldValue != null ? String(oldValue) : null,
      new_value: newValue != null ? String(newValue) : null,
      changed_by: user?.email || "unknown",
      changed_by_name: user?.full_name || "",
      changed_by_role: user?.role || "",
      description: description || `${action} on ${recordType}`,
    });
  } catch (_) {
    // Audit failures should never block main flow
  }
}