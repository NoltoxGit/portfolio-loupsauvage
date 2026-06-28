import type { ContentItem, ContentMedia } from "../../types/content";

export function resolveMediaPath(path: string | null | undefined): string {
  const value = String(path || "").trim();
  if (!value) return "";
  if (/^(data:image\/|blob:|https?:\/\/|file:|\/)/i.test(value)) return value;
  if (value.startsWith("assets/") || value.startsWith("uploads/")) return `/${value}`;
  return value;
}

export function coverMedia(item: ContentItem): ContentMedia | null {
  return item.media.find((media) => media.kind === "cover") ?? item.media[0] ?? null;
}

export function mediaLabel(item: ContentItem): string {
  return item.shortDescription || item.description || item.title;
}

export function platformLabel(value: string | null, otherLabel = "Autre", fallbackLabel = "Portfolio"): string {
  if (value === "builtbybit") return "BuiltByBit";
  if (value === "mcmodels") return "MCModels";
  if (value === "sketchfab") return "Sketchfab";
  if (value === "other") return otherLabel;
  return fallbackLabel;
}
