export const SubscriptionPlan = {
  FREE: "FREE",
  PRO: "PRO",
  BUSINESS: "BUSINESS",
} as const;
export type SubscriptionPlan =
  (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan];
export const SubscriptionTier = {
  FREE: "FREE",
  CREATOR: "CREATOR",
  PRO: "PRO",
} as const;
export type SubscriptionTier =
  (typeof SubscriptionTier)[keyof typeof SubscriptionTier];
export const ProjectStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];
export const ExportType = {
  PDF: "PDF",
  PNG: "PNG",
  THUMBNAIL: "THUMBNAIL",
} as const;
export type ExportType = (typeof ExportType)[keyof typeof ExportType];
export const ExportStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;
export type ExportStatus = (typeof ExportStatus)[keyof typeof ExportStatus];
export const Status = {
  PENDING: "PENDING",
  CREATING: "CREATING",
  INITING: "INITING",
  RUNNING: "RUNNING",
  STOPPED: "STOPPED",
  DELETED: "DELETED",
} as const;
export type Status = (typeof Status)[keyof typeof Status];
