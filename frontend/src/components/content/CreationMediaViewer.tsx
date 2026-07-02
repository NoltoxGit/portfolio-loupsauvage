import { useEffect, useMemo, useState } from "react";
import type { ContentItem } from "../../types/content";
import { hasSketchfabModel, SketchfabEmbed } from "./SketchfabEmbed";
import { Gallery } from "./Gallery";
import { hasImageMedia } from "./media";
import { hasModelGlb, ModelPreviewCard } from "./ModelPreviewCard";

type MediaMode = "media" | "model" | "sketchfab";

export function CreationMediaViewer({ item }: { item: ContentItem }) {
  const hasMedia = hasImageMedia(item);
  const hasModel = hasModelGlb(item);
  const hasSketchfab = hasSketchfabModel(item.sketchfabUrl);
  const initialMode = useMemo<MediaMode>(() => {
    if (hasMedia) return "media";
    if (hasModel) return "model";
    return "sketchfab";
  }, [hasMedia, hasModel]);
  const [mode, setMode] = useState<MediaMode>(initialMode);
  const availableModes = [
    hasMedia ? "media" : null,
    hasModel ? "model" : null,
    hasSketchfab ? "sketchfab" : null,
  ].filter(Boolean) as MediaMode[];

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, item.id]);

  if (availableModes.length > 1) {
    return (
      <div className="creation-media-viewer">
        <div className="creation-media-tabs" role="tablist" aria-label="Médias de la création">
          {availableModes.map((entry) => (
            <button
              key={entry}
              className={`creation-media-tab${mode === entry ? " is-active" : ""}`}
              type="button"
              role="tab"
              aria-selected={mode === entry}
              onClick={() => setMode(entry)}
            >
              {entry === "media" ? "Médias" : entry === "model" ? "Modèle 3D" : "Preview Sketchfab"}
            </button>
          ))}
        </div>

        {mode === "media" ? (
          <Gallery item={item} />
        ) : mode === "model" ? (
          <ModelPreviewCard item={item} />
        ) : (
          <SketchfabEmbed title={item.title} url={item.sketchfabUrl} />
        )}
      </div>
    );
  }

  if (hasModel) {
    return <ModelPreviewCard item={item} />;
  }

  if (hasSketchfab) {
    return <SketchfabEmbed title={item.title} url={item.sketchfabUrl} />;
  }

  return <Gallery item={item} />;
}
