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
}

export interface ContentItem {
  id: number;
  type: ContentType;
  title: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  status: ContentStatus;
  sourceContext: SourceContext;
  clientPermission: boolean;
  sketchfabUrl: string | null;
  externalUrl: string | null;
  externalPlatform: ExternalPlatform | null;
  priceLabel: string | null;
  sortOrder: number;
  publishedAt: string | null;
  media: ContentMedia[];
}
