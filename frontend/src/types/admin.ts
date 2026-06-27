import type { ContentItem, ContentStatus, ContentType, ExternalPlatform, SourceContext } from "./content";
import type { PricingPlan } from "./pricing";

export interface AdminDashboardSummary {
  content: {
    total: number;
    draft: number;
    published: number;
    archived: number;
    creations: number;
    marketplace: number;
  };
  pricing: {
    total: number;
    active: number;
    inactive: number;
  };
}

export interface AdminContentFilters {
  type?: ContentType;
  status?: ContentStatus;
}

export interface AdminContentPayload {
  type: ContentType;
  title: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  status: ContentStatus;
  sourceContext: SourceContext;
  clientPermission: boolean;
  sketchfabUrl?: string | null;
  externalUrl?: string | null;
  externalPlatform?: ExternalPlatform | null;
  priceLabel?: string | null;
  sortOrder?: number;
  publishedAt?: string | null;
}

export interface AdminContentStatusPayload {
  status: ContentStatus;
}

export type AdminContentItem = ContentItem & {
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
};

export interface AdminPricingPayload {
  slug: string;
  title: string;
  subtitle?: string | null;
  priceLabel: string;
  description?: string | null;
  features: string[];
  sortOrder?: number;
  isActive: boolean;
}

export interface AdminPricingActivePayload {
  isActive: boolean;
}

export type AdminPricingPlan = PricingPlan & {
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
