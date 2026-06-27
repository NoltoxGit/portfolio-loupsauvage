import { useMemo, useState } from "react";
import type { ContentItem } from "../../types/content";
import { resolveMediaPath } from "./media";

export function Gallery({ item }: { item: ContentItem }) {
  const images = useMemo(
    () =>
      item.media
        .map((media) => ({ ...media, path: resolveMediaPath(media.path) }))
        .filter((media) => Boolean(media.path)),
    [item.media],
  );
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return <div className="creation-media-empty">Les images de cette creation arrivent bientot.</div>;
  }

  return (
    <div className="creation-detail-gallery">
      <div className="creation-main-media" data-gallery-main>
        <img className="creation-main-image" src={images[active].path} alt={images[active].alt || item.title} loading="eager" />
      </div>

      {images.length > 1 ? (
        <div className="creation-thumbs" aria-label="Galerie">
          {images.map((image, index) => (
            <button
              key={image.id}
              className={`creation-thumb${active === index ? " is-active" : ""}`}
              type="button"
              onClick={() => setActive(index)}
            >
              <img className="creation-thumb-image" src={image.path} alt={image.alt || item.title} loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
