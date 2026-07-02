import { getMarketplace } from "../../api/publicSite";
import { MarketplaceCard } from "../../components/content/MarketplaceCard";
import { Layout } from "../../components/layout/Layout";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { useAsyncData } from "../../hooks/useAsyncData";
import { useI18n } from "../../i18n/useI18n";

export function MarketplacePage() {
  const { t } = useI18n();
  const { data, error, loading } = useAsyncData(getMarketplace, []);

  return (
    <Layout page="marketplace">
      <section className="archive-hero" id="top" aria-labelledby="marketplace-page-title">
        <div className="archive-hero-copy">
          <p className="eyebrow">{t("pages.marketplace.eyebrow")}</p>
          <h1 id="marketplace-page-title">{t("pages.marketplace.heading")}</h1>
          <p>{t("pages.marketplace.text")}</p>
        </div>
      </section>

      <section className="section marketplace-section" aria-labelledby="marketplace-grid-title">
        <div className="section-inner marketplace-layout">
          <div className="marketplace-copy">
            <p className="eyebrow">{t("pages.marketplace.gridEyebrow")}</p>
            <h2 id="marketplace-grid-title">{t("pages.marketplace.gridTitle")}</h2>
            <p>{t("pages.marketplace.gridText")}</p>
          </div>
          {loading ? (
            <LoadingState />
          ) : error || !data ? (
            <ErrorState />
          ) : data.length === 0 ? (
            <div className="empty-state">
              <strong>Aucun produit publie pour le moment.</strong>
              <p>Les ressources marketplace seront listees ici des leur publication.</p>
            </div>
          ) : (
            <div className="marketplace-products">
              {data.map((item) => (
                <MarketplaceCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
