export type SubscriptionTier = "basic" | "pro" | "ultra";

export interface LicenseKey {
  key: string;
  tier: SubscriptionTier | "lifetime";
  email: string;
  expiresAt?: string;
  createdAt: string;
}
