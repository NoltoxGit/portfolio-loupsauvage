import type { CSSProperties } from "react";
import type { ContentItem, ContentMedia } from "../../types/content";

export function resolveMediaPath(path: string | null | undefined): string {
  const value = String(path || "").trim();
  if (!value) return "";
  if (/^(data:image\/|blob:|https?:\/\/|file:|\/)/i.test(value)) return value;
  if (value.startsWith("assets/") || value.startsWith("uploads/")) return `/${value}`;
  return value;
}

export function coverMedia(item: ContentItem): ContentMedia | null {
  return imageMedia(item).find((media) => media.kind === "cover") ?? imageMedia(item)[0] ?? null;
}

export function imageMedia(item: ContentItem): ContentMedia[] {
  return item.media.filter((media) => Boolean(resolveMediaPath(media.path)));
}

export function primaryMedia(item: ContentItem): ContentMedia | null {
  const media = imageMedia(item);

  return (
    media.find((entry) => entry.kind === "cover") ??
    media.find((entry) => entry.kind === "thumbnail") ??
    media[0] ??
    null
  );
}

export function hasImageMedia(item: ContentItem): boolean {
  return primaryMedia(item) !== null;
}

export function primaryImagePath(item: ContentItem): string {
  const media = primaryMedia(item);

  return media ? resolveMediaPath(media.path) : "";
}

export function marketplaceImagePath(item: ContentItem): string {
  const localPath = primaryImagePath(item);

  if (localPath) {
    return localPath;
  }

  const sync = item.builtbybitSyncJson;

  if (sync && typeof sync === "object" && "coverImageUrl" in sync && typeof sync.coverImageUrl === "string") {
    return resolveMediaPath(sync.coverImageUrl);
  }

  return "";
}

export function mediaBackgroundStyle(path: string | null | undefined) {
  const resolved = resolveMediaPath(path);

  if (!resolved) {
    return undefined;
  }

  return {
    "--media-backdrop-image": `url("${resolved.replace(/"/g, "%22")}")`,
  } as CSSProperties & Record<string, string>;
}

export function mediaLabel(item: ContentItem): string {
  return item.shortDescription || item.title;
}

export function sourceContextLabel(item: ContentItem, commissionLabel = "Commission", creationLabel = "Création"): string {
  if (item.sourceLabel?.trim()) return item.sourceLabel.trim();
  if (item.sourceContext === "private_commission") return commissionLabel;
  if (item.sourceContext === "other") return "Autre";
  return creationLabel;
}

export function platformLabel(value: string | null, otherLabel = "Autre", fallbackLabel = "Portfolio", customLabel?: string | null): string {
  if (customLabel?.trim()) return customLabel.trim();
  if (value === "builtbybit") return "BuiltByBit";
  if (value === "mcmodels") return "MCModels";
  if (value === "sketchfab") return "Sketchfab";
  if (value === "other") return otherLabel;
  return fallbackLabel;
}
