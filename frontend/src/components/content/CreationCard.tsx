import type { CSSProperties } from "react";
import type { ContentItem } from "../../types/content";
import { useI18n } from "../../i18n/useI18n";
import { coverMedia, mediaLabel, resolveMediaPath, sourceContextLabel } from "./media";

export function CreationCard({
  item,
  index = 0,
  archive = false,
  href,
}: {
  item: ContentItem;
  index?: number;
  archive?: boolean;
  href?: string;
}) {
  const { t } = useI18n();
  const cover = coverMedia(item);
  const image = resolveMediaPath(cover?.path);
  const span = archive ? 4 : index % 5 === 0 ? 4 : 3;
  const style = {
    "--creation-span": span,
    "--creation-tablet-span": archive ? 3 : 3,
    "--creation-min-height": archive ? "390px" : "310px",
  } as CSSProperties;

  return (
    <a
      className="creation-card creation-standard"
      href={href ?? `/creations/${encodeURIComponent(item.slug)}`}
      onClick={href === "#" ? (event) => event.preventDefault() : undefined}
      style={style}
      aria-label={item.title}
    >
      <div className="creation-visual visual-forest" aria-hidden="true">
        {image ? (
          <img className="showcase-image" src={image} alt="" loading="lazy" data-image-position="center" />
        ) : (
          <>
            <span className="visual-cube cube-a"></span>
            <span className="visual-cube cube-b"></span>
            <span className="visual-cube cube-c"></span>
            <span className="visual-cube cube-d"></span>
            <span className="visual-line"></span>
          </>
        )}
      </div>
      <div className="creation-content" aria-hidden="false">
        <span className="content-tag">{sourceContextLabel(item, t("cards.commission"), t("cards.creation"))}</span>
        <h3>{item.title}</h3>
        <p>{mediaLabel(item)}</p>
      </div>
    </a>
  );
}
