import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.body.classList.add("has-model-modal");
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.classList.remove("has-model-modal");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!modelPath) {
    return null;
  }

  return (
    <>
      <button className="model-preview-card" type="button" onClick={() => setOpen(true)}>
        <span className="model-preview-label">Voir le modèle 3D</span>
        {previewPath ? (
          <img src={previewPath} alt="" loading="lazy" />
        ) : (
          <ModelViewer
            src={modelPath}
            title={item.title}
            className="is-static"
            interactive={false}
            onPreviewGenerated={onPreviewGenerated}
            previewOnceKey={item.modelGlbPath ?? item.id}
          />
        )}
      </button>

      {open ? (
        <div className="model-modal" role="dialog" aria-modal="true" aria-label={`Modèle 3D ${item.title}`} onMouseDown={() => setOpen(false)}>
          <div className="model-modal-panel" onMouseDown={(event) => event.stopPropagation()}>
            <button className="model-modal-close" type="button" aria-label="Fermer" onClick={() => setOpen(false)}>
              ×
            </button>
            <ModelViewer src={modelPath} title={item.title} interactive />
          </div>
        </div>
      ) : null}
    </>
  );
}

