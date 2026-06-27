import { getMarketplace } from "../../api/publicSite";
import { MarketplaceCard } from "../../components/content/MarketplaceCard";
import { Layout } from "../../components/layout/Layout";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { useAsyncData } from "../../hooks/useAsyncData";

export function MarketplacePage() {
  const { data, error, loading } = useAsyncData(getMarketplace, []);

  return (
    <Layout page="marketplace">
      <section className="archive-hero" id="top" aria-labelledby="marketplace-page-title">
        <div className="archive-hero-copy">
          <p className="eyebrow">Marketplace</p>
          <h1 id="marketplace-page-title">Ressources marketplace</h1>
          <p>Des ressources publiees ou vendues sur BuildByBit, MCModels, Sketchfab et autres plateformes.</p>
        </div>
      </section>

      <section className="section marketplace-section" aria-labelledby="marketplace-grid-title">
        <div className="section-inner marketplace-layout">
          <div className="marketplace-copy">
            <p className="eyebrow">Best sellers</p>
            <h2 id="marketplace-grid-title">Packs disponibles</h2>
            <p>Une selection de ressources pretes a integrer dans vos projets Minecraft.</p>
          </div>
          {loading ? <LoadingState /> : error || !data ? <ErrorState /> : <div className="marketplace-products">{data.map((item) => <MarketplaceCard key={item.id} item={item} />)}</div>}
        </div>
      </section>
    </Layout>
  );
}
