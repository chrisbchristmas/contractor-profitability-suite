/**
 * Role-based permission helpers.
 * Roles: "Owner", "Project Manager", "Admin"
 */

export const ROLES = {
  OWNER: "Owner",
  PM: "Project Manager",
  ADMIN: "Admin",
};

export const isOwner = (user) => user?.role === ROLES.OWNER;
export const isPM = (user) => user?.role === ROLES.PM;
export const isAdmin = (user) => user?.role === ROLES.ADMIN;

// Financial fields visibility — Owner only
export const canViewFinancials = (user) => isOwner(user);

// Markup editing — Owner only
export const canEditMarkup = (user) => isOwner(user);

// CO approval — Owner only
export const canApproveCO = (user) => isOwner(user);

// Job deletion — Owner only
export const canDeleteJob = (user) => isOwner(user);

// CO deletion — Owner only (including approved)
export const canDeleteCO = (user) => isOwner(user);

// CO editing: Owner = anything, PM = draft only, Admin = status only
export const canEditCO = (user, co) => {
  if (isOwner(user)) return true;
  if (isPM(user)) return co?.status !== "approved";
  return false;
};

// Can edit job
export const canEditJob = (user) => isOwner(user) || isPM(user) || isAdmin(user);

// Can create CO
export const canCreateCO = (user) => isOwner(user) || isPM(user);

// Can generate PDF
export const canGeneratePDF = (user) => !!user;

// Job visibility: Owner/Admin = all, PM = assigned only
export const canViewJob = (user, job) => {
  if (!user) return false;
  if (isOwner(user) || isAdmin(user)) return true;
  if (isPM(user)) return job?.assigned_user_id === user.id || job?.user_id === user.id || job?.created_by === user.email;
  return false;
};

// Subscription gate — matches SubscriptionGate.jsx canAccess logic
export const hasActiveSubscription = (user) => {
  if (!user) return false;
  const allowedRoles = ["admin", "owner", "pm", "Admin", "Owner", "Project Manager"];
  if (allowedRoles.includes(user.role)) return true;
  if (user.subscription_status === "active") return true;
  if (user.subscription_status === "trial") {
    if (!user.trial_ends_at) return true;
    return new Date(user.trial_ends_at) > new Date();
  }
  return false;
};