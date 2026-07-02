import { CreationCard } from "../content/CreationCard";
import { CreationMediaViewer } from "../content/CreationMediaViewer";
import { MarketplaceCard } from "../content/MarketplaceCard";
import { sourceContextLabel } from "../content/media";
import type { AdminContentItem } from "../../types/admin";

export function ContentPreview({ item }: { item: AdminContentItem }) {
  if (item.type === "marketplace") {
    return (
      <div className="admin-preview-surface">
        <div className="admin-preview-note">
          <span>Prévisualisation marketplace</span>
          <p>Le site public affiche les ressources marketplace sous forme de cartes, sans page détail dédiée.</p>
        </div>
        <div className="marketplace-products admin-preview-marketplace">
          <MarketplaceCard item={item} />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-preview-surface">
      <div className="admin-preview-note">
        <span>Prévisualisation création</span>
        <p>Cette vue reprend le rendu public même si le contenu est encore en brouillon.</p>
      </div>

      <div className="creations-grid admin-preview-card-grid">
        <CreationCard item={item} archive href="#" />
      </div>

      <div className="creation-detail-layout admin-preview-detail">
        <CreationMediaViewer item={item} />
        <div className="creation-detail-copy">
          <p className="eyebrow">{sourceContextLabel(item)}</p>
          <h1>{item.title}</h1>
        </div>
      </div>
    </div>
  );
}
