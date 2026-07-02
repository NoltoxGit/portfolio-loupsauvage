import { MouseEvent, useEffect, useState } from "react";
import type { ContentItem } from "../../types/content";
import { resolveMediaPath } from "./media";
import { ModelViewer } from "./ModelViewer";

export function hasModelGlb(item: Pick<ContentItem, "modelGlbPath">): boolean {
  return Boolean(resolveMediaPath(item.modelGlbPath));
}

export function ModelPreviewCard({ item, onPreviewGenerated }: { item: ContentItem; onPreviewGenerated?: (imageData: string) => void }) {
  const [open, setOpen] = useState(false);
  const modelPath = resolveMediaPath(item.modelGlbPath);
  const previewPath = resolveMediaPath(item.modelPreviewImagePath);
  const yawDegrees = item.modelViewerYawDegrees ?? 180;

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    }
  };

  const closeViewer = () => {
    exitFullscreen();
    setOpen(false);
  };

  const openViewer = () => {
    setOpen(true);

    if (document.documentElement.requestFullscreen) {
      void document.documentElement.requestFullscreen().catch(() => undefined);
    }
  };

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeViewer();
      }
    };

    document.body.classList.add("has-model-modal");
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.classList.remove("has-model-modal");
      window.removeEventListener("keydown", onKeyDown);
      exitFullscreen();
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      exitFullscreen();
    }
  }, [open]);

  if (!modelPath) {
    return null;
  }

  return (
    <>
      <button className="model-preview-card" type="button" onClick={openViewer}>
        <span className="model-preview-label">Voir le modèle 3D</span>
        {previewPath ? (
          <img src={previewPath} alt="" loading="lazy" />
        ) : (
          <ModelViewer
            src={modelPath}
            title={item.title}
            className="is-static"
            interactive={false}
            yawDegrees={yawDegrees}
            onPreviewGenerated={onPreviewGenerated}
            previewOnceKey={`${item.modelGlbPath ?? item.id}-${yawDegrees}`}
          />
        )}
      </button>

      {open ? (
        <div className="model-modal" role="dialog" aria-modal="true" aria-label={`Modèle 3D ${item.title}`} onMouseDown={closeViewer}>
          <div
            className="model-modal-panel"
            onMouseDown={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}
          >
            <button className="model-modal-close" type="button" aria-label="Fermer" onClick={closeViewer}>
              ×
            </button>
            <ModelViewer src={modelPath} title={item.title} interactive yawDegrees={yawDegrees} />
          </div>
        </div>
      ) : null}
    </>
  );
}

