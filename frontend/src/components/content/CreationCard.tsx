import type { CSSProperties } from "react";
import type { ContentItem } from "../../types/content";
import { coverMedia, mediaLabel, resolveMediaPath } from "./media";

export function CreationCard({ item, index = 0, archive = false }: { item: ContentItem; index?: number; archive?: boolean }) {
  const cover = coverMedia(item);
  const image = resolveMediaPath(cover?.path);
  const span = archive ? 4 : index % 5 === 0 ? 4 : 3;
  const style = {
    "--creation-span": span,
    "--creation-tablet-span": archive ? 3 : 3,
    "--creation-min-height": archive ? "390px" : "310px",
  } as CSSProperties;

  return (
    <a className="creation-card creation-standard" href={`/creations/${encodeURIComponent(item.slug)}`} style={style} aria-label={item.title}>
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
        <span className="content-tag">{item.sourceContext === "private_commission" ? "Commission" : "Creation"}</span>
        <h3>{item.title}</h3>
        <p>{mediaLabel(item)}</p>
      </div>
    </a>
  );
}
