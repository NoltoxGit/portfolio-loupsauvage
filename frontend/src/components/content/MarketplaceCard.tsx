import type { ContentItem } from "../../types/content";
import { useI18n } from "../../i18n/useI18n";
import { coverMedia, mediaLabel, platformLabel, resolveMediaPath } from "./media";

export function MarketplaceCard({ item }: { item: ContentItem }) {
  const { t } = useI18n();
  const cover = coverMedia(item);
  const image = resolveMediaPath(cover?.path);
  const href = item.externalUrl || `/creations/${encodeURIComponent(item.slug)}`;
  const external = /^https?:\/\//i.test(href);

  return (
    <article className="product-card" tabIndex={0}>
      <div className="product-thumb visual-forest" aria-hidden="true">
        {image ? <img className="showcase-image" src={image} alt="" loading="lazy" /> : null}
      </div>
      <div className="product-copy">
        <span className="content-tag">{platformLabel(item.externalPlatform, t("cards.platformOther"), t("cards.platformPortfolio"))}</span>
        <h3>{item.title}</h3>
        <p>{item.priceLabel || mediaLabel(item)}</p>
        <a className="text-link card-cta" href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
          {t("cards.view")}
        </a>
      </div>
    </article>
  );
}
