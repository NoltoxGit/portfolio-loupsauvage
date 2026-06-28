import { getCreations } from "../../api/publicSite";
import { CreationCard } from "../../components/content/CreationCard";
import { Layout } from "../../components/layout/Layout";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { useAsyncData } from "../../hooks/useAsyncData";
import { useI18n } from "../../i18n/useI18n";

export function CreationsPage() {
  const { t } = useI18n();
  const { data, error, loading } = useAsyncData(getCreations, []);

  return (
    <Layout page="creations">
      <section className="archive-hero" id="top" aria-labelledby="archive-title">
        <div className="archive-hero-copy">
          <p className="eyebrow">{t("pages.creations.archiveEyebrow")}</p>
          <h1 id="archive-title">{t("pages.creations.archiveTitle")}</h1>
          <p>{t("pages.creations.archiveText")}</p>
          <div className="archive-actions">
            <a className="button button-primary" href="/#discord">
              {t("pages.creations.archiveOrder")}
            </a>
            <a className="button button-secondary" href="/#top">
              {t("pages.creations.archiveBack")}
            </a>
          </div>
        </div>
      </section>

      <section className="section archive-section" id="creations" aria-labelledby="archive-grid-title">
        <div className="section-inner">
          <div className="section-heading">
            <p className="eyebrow">{t("pages.creations.galleryEyebrow")}</p>
            <h2 id="archive-grid-title">{t("pages.creations.galleryTitle")}</h2>
            <p>{t("pages.creations.galleryText")}</p>
          </div>
          {loading ? <LoadingState /> : error || !data ? <ErrorState /> : <div className="creations-grid creations-archive-grid">{data.map((item, index) => <CreationCard key={item.id} item={item} index={index} archive />)}</div>}
        </div>
      </section>
    </Layout>
  );
}
