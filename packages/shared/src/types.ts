export interface DesignStyle {
  name: string;
  slug: string;
  description: string;
  free: boolean;
  status: "new" | "updated" | "stable";
  dependencies: string[];
}

export interface ComponentVariant {
  name: string;
  slug: string;
}

export interface ComponentFile {
  path: string;
  content: string;
  type: "registry:ui" | "registry:hook" | "registry:lib";
}

export interface ComponentDefinition {
  name: string;
  type: "component" | "block";
  category: string;
  description: string;
  styles: DesignStyle[];
  variants: ComponentVariant[];
  files: Record<string, ComponentFile[]>;
}

export interface RegistryIndex {
  components: Omit<ComponentDefinition, "files">[];
}

export type SubscriptionTier = "basic" | "pro" | "ultra";

export interface LicenseKey {
  key: string;
  tier: SubscriptionTier | "lifetime";
  email: string;
  expiresAt?: string;
  createdAt: string;
}
