import type { ContentItem, ContentMedia, ContentStatus, ContentType, ExternalPlatform, SourceContext } from "./content";
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
  status: ContentStatus;
  sourceContext: SourceContext;
  sourceLabel?: string | null;
  clientPermission: boolean;
  sketchfabUrl?: string | null;
  externalUrl?: string | null;
  externalPlatform?: ExternalPlatform | null;
  platformLabel?: string | null;
  priceLabel?: string | null;
  builtbybitResourceId?: string | null;
  builtbybitSyncJson?: unknown | null;
  publishedAt?: string | null;
  displayDate: string;
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
  createdByUserId?: number | null;
  updatedByUserId?: number | null;
  publishedByUserId?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminMediaKind = ContentMedia["kind"];

export type AdminMediaItem = ContentMedia & {
  contentItemId: number;
  uploadedByUserId?: number | null;
  updatedByUserId?: number | null;
  createdAt: string;
};

export interface AdminMediaUploadPayload {
  contentItemId: number;
  kind: AdminMediaKind;
  alt?: string | null;
  sortOrder?: number;
  file: File;
}

export interface AdminMediaUpdatePayload {
  kind: AdminMediaKind;
  alt?: string | null;
  sortOrder?: number;
}

export interface AdminMediaDeleteResult {
  id: number;
  deleted: boolean;
  fileDeleted: boolean;
}

export interface AdminModelUploadPayload {
  contentItemId: number;
  file: File;
}

export interface AdminModelPreviewPayload {
  contentItemId: number;
  imageData: string;
}

export interface AdminModelInfo {
  contentItemId: number;
  type: ContentType;
  title: string;
  modelGlbPath: string | null;
  modelPreviewImagePath: string | null;
  modelWatermarkEnabled: boolean;
}

export interface AdminModelDeleteResult {
  contentItemId: number;
  deleted: boolean;
  fileDeleted: boolean;
  previewDeleted: boolean;
  item: AdminModelInfo;
}

export interface BuiltByBitPreviewPayload {
  input: string;
}

export interface BuiltByBitPreview {
  resourceId: string;
  title: string;
  summary: string;
  descriptionBbcode?: string;
  descriptionHtmlPreview?: string;
  externalUrl: string;
  coverImageUrl: string;
  carouselImageUrls: string[];
  priceLabel: string;
  categoryLabel: string;
  rawSyncJson: unknown;
}
