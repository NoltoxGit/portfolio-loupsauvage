import { useMemo, useState } from "react";
import type { ContentItem } from "../../types/content";
import { useI18n } from "../../i18n/useI18n";
import { mediaBackgroundStyle, resolveMediaPath } from "./media";

export function Gallery({ item }: { item: ContentItem }) {
  const { t } = useI18n();
  const images = useMemo(
    () =>
      item.media
        .map((media) => ({ ...media, path: resolveMediaPath(media.path) }))
        .filter((media) => Boolean(media.path)),
    [item.media],
  );
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return <div className="creation-media-empty">{t("pages.creationDetail.noImages")}</div>;
  }

  return (
    <div className="creation-detail-gallery">
      <div className="creation-main-media has-media-backdrop" data-gallery-main style={mediaBackgroundStyle(images[active].path)}>
        <img className="creation-main-image" src={images[active].path} alt={images[active].alt || item.title} loading="eager" />
      </div>

      {images.length > 1 ? (
        <div className="creation-thumbs" aria-label={t("pages.creationDetail.gallery", "Galerie")}>
          {images.map((image, index) => (
            <button
              key={image.id}
              className={`creation-thumb${active === index ? " is-active" : ""}`}
              type="button"
              onClick={() => setActive(index)}
              style={mediaBackgroundStyle(image.path)}
            >
              <img className="creation-thumb-image" src={image.path} alt={image.alt || item.title} loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
