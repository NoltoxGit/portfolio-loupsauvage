function sketchfabEmbedUrl(value: string | null): string {
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

export function SketchfabEmbed({ title, url }: { title: string; url: string | null }) {
  const embedUrl = sketchfabEmbedUrl(url);

  if (!embedUrl) {
    return <div className="sketchfab-empty">Modele 3D a venir.</div>;
  }

  return (
    <div className="sketchfab-frame">
      <iframe title={`Sketchfab - ${title}`} src={embedUrl} allow="autoplay; fullscreen; xr-spatial-tracking" allowFullScreen></iframe>
    </div>
  );
}
