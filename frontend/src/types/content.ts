export type ContentType = "creation" | "marketplace";
export type ContentStatus = "draft" | "published" | "archived";
export type SourceContext = "personal" | "private_commission" | "marketplace_product" | "other";
export type ExternalPlatform = "builtbybit" | "mcmodels" | "sketchfab" | "other";

export interface ContentMedia {
  id: number;
  kind: "cover" | "gallery" | "render" | "thumbnail";
  path: string;
  alt: string | null;
  sortOrder: number;
  uploadedByUserId?: number | null;
  updatedByUserId?: number | null;
}

export interface ContentItem {
  id: number;
  type: ContentType;
  title: string;
  slug: string;
  shortDescription: string | null;
  status?: ContentStatus;
  sourceContext: SourceContext;
  sourceLabel: string | null;
  clientPermission: boolean;
  sketchfabUrl: string | null;
  externalUrl: string | null;
  externalPlatform: ExternalPlatform | null;
  platformLabel: string | null;
  priceLabel: string | null;
  builtbybitResourceId: string | null;
  builtbybitSyncJson: {
    resourceId?: string | null;
    coverImageUrl?: string | null;
    carouselImageUrls?: string[];
  } | null;
  sortOrder: number;
  publishedAt: string | null;
  displayDate: string;
  media: ContentMedia[];
  createdByUserId?: number | null;
  updatedByUserId?: number | null;
  publishedByUserId?: number | null;
}
