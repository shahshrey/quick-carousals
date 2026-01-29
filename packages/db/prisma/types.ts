import type { ColumnType } from "kysely";
export type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U>
    ? ColumnType<S, I | undefined, U>
    : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

import type {
  SubscriptionPlan,
  SubscriptionTier,
  ProjectStatus,
  ExportType,
  ExportStatus,
  Status,
} from "./enums";

export type Account = {
  id: Generated<string>;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
};
export type BrandKit = {
  id: Generated<string>;
  userId: string;
  name: string;
  colors: Generated<unknown>;
  fonts: Generated<unknown>;
  logoUrl: string | null;
  handle: string | null;
  footerStyle: string | null;
  isDefault: Generated<boolean>;
  createdAt: Generated<Timestamp>;
  updatedAt: Timestamp;
};
export type Customer = {
  id: Generated<number>;
  authUserId: string;
  name: string | null;
  plan: SubscriptionPlan | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeCurrentPeriodEnd: Timestamp | null;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
};
export type Export = {
  id: Generated<string>;
  projectId: string;
  exportType: ExportType;
  status: Generated<ExportStatus>;
  fileUrl: string | null;
  errorMessage: string | null;
  createdAt: Generated<Timestamp>;
  completedAt: Timestamp | null;
};
export type K8sClusterConfig = {
  id: Generated<number>;
  name: string;
  location: string;
  authUserId: string;
  plan: Generated<SubscriptionPlan | null>;
  network: string | null;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
  status: Generated<Status | null>;
  delete: Generated<boolean | null>;
};
export type Profile = {
  id: Generated<string>;
  clerkUserId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  subscriptionTier: Generated<SubscriptionTier>;
  createdAt: Generated<Timestamp>;
  updatedAt: Timestamp;
};
export type Project = {
  id: Generated<string>;
  userId: string;
  title: string;
  brandKitId: string | null;
  styleKitId: string;
  status: Generated<ProjectStatus>;
  createdAt: Generated<Timestamp>;
  updatedAt: Timestamp;
};
export type Session = {
  id: Generated<string>;
  sessionToken: string;
  userId: string;
  expires: Timestamp;
};
export type Slide = {
  id: Generated<string>;
  projectId: string;
  orderIndex: number;
  layoutId: string;
  slideType: string;
  layers: Generated<unknown>;
  content: Generated<unknown>;
  createdAt: Generated<Timestamp>;
  updatedAt: Timestamp;
};
export type StyleKit = {
  id: string;
  name: string;
  typography: unknown;
  colors: unknown;
  spacingRules: unknown;
  isPremium: Generated<boolean>;
};
export type TemplateLayout = {
  id: string;
  name: string;
  category: string;
  slideType: string;
  layersBlueprint: unknown;
};
export type User = {
  id: Generated<string>;
  name: string | null;
  email: string | null;
  emailVerified: Timestamp | null;
  image: string | null;
};
export type VerificationToken = {
  identifier: string;
  token: string;
  expires: Timestamp;
};
export type DB = {
  Account: Account;
  BrandKit: BrandKit;
  Customer: Customer;
  Export: Export;
  K8sClusterConfig: K8sClusterConfig;
  Profile: Profile;
  Project: Project;
  Session: Session;
  Slide: Slide;
  StyleKit: StyleKit;
  TemplateLayout: TemplateLayout;
  User: User;
  VerificationToken: VerificationToken;
};
