import { useI18n } from "../../i18n/useI18n";

export function sketchfabEmbedUrl(value: string | null): string {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    if (!/(^|\.)sketchfab\.com$/i.test(url.hostname)) return "";
    const embedMatch = url.pathname.match(/\/models\/([a-z0-9]+)\/embed/i);
    if (embedMatch) return `https://sketchfab.com/models/${embedMatch[1]}/embed`;

    const modelMatch = url.pathname.match(/(?:\/3d-models\/[^/]*-|\/models\/)([a-f0-9]{24,40})/i);
    if (modelMatch) return `https://sketchfab.com/models/${modelMatch[1]}/embed`;
  } catch {
    return "";
  }

  return "";
}

export function hasSketchfabModel(url: string | null): boolean {
  return Boolean(sketchfabEmbedUrl(url));
}

export function SketchfabEmbed({
  title,
  url,
  compact = false,
  interactive = true,
}: {
  title: string;
  url: string | null;
  compact?: boolean;
  interactive?: boolean;
}) {
  const { t } = useI18n();
  const embedUrl = sketchfabEmbedUrl(url);

  if (!embedUrl) {
    return <div className="sketchfab-empty">{t("pages.creationDetail.noModel")}</div>;
  }

  return (
    <div className={`sketchfab-frame${compact ? " is-compact" : ""}${interactive ? "" : " is-passive"}`}>
      <iframe
        title={`Sketchfab - ${title}`}
        src={embedUrl}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
        tabIndex={interactive ? undefined : -1}
      ></iframe>
    </div>
  );
}
