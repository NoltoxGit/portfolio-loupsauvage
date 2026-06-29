import { useEffect, useMemo, useState } from "react";
import type { ContentItem } from "../../types/content";
import { hasSketchfabModel, SketchfabEmbed } from "./SketchfabEmbed";
import { Gallery } from "./Gallery";
import { hasImageMedia } from "./media";

type MediaMode = "media" | "sketchfab";

export function CreationMediaViewer({ item }: { item: ContentItem }) {
  const hasMedia = hasImageMedia(item);
  const hasSketchfab = hasSketchfabModel(item.sketchfabUrl);
  const initialMode = useMemo<MediaMode>(() => (hasMedia ? "media" : "sketchfab"), [hasMedia]);
  const [mode, setMode] = useState<MediaMode>(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, item.id]);

  if (hasMedia && hasSketchfab) {
    return (
      <div className="creation-media-viewer">
        <div className="creation-media-tabs" role="tablist" aria-label="Media de la creation">
          <button
            className={`creation-media-tab${mode === "media" ? " is-active" : ""}`}
            type="button"
            role="tab"
            aria-selected={mode === "media"}
            onClick={() => setMode("media")}
          >
            Medias
          </button>
          <button
            className={`creation-media-tab${mode === "sketchfab" ? " is-active" : ""}`}
            type="button"
            role="tab"
            aria-selected={mode === "sketchfab"}
            onClick={() => setMode("sketchfab")}
          >
            Preview Sketchfab
          </button>
        </div>

        {mode === "media" ? <Gallery item={item} /> : <SketchfabEmbed title={item.title} url={item.sketchfabUrl} />}
      </div>
    );
  }

  if (hasSketchfab) {
    return <SketchfabEmbed title={item.title} url={item.sketchfabUrl} />;
  }

  return <Gallery item={item} />;
}
