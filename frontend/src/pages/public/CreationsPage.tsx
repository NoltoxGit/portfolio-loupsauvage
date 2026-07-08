import { getCreations } from "../../api/publicSite";
import { CreationCard } from "../../components/content/CreationCard";
import { mediaBackgroundStyle, modelPreviewImagePath, primaryImagePath } from "../../components/content/media";
import { Layout } from "../../components/layout/Layout";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { useAsyncData } from "../../hooks/useAsyncData";
import { useI18n } from "../../i18n/useI18n";
import type { CreationBundle } from "../../types/content";

function BundleCard({ bundle }: { bundle: CreationBundle }) {
  const preview = bundle.previewItem;
  const image = preview ? primaryImagePath(preview) || modelPreviewImagePath(preview) : null;

  return (
    <a className="creation-card creation-bundle-card" href={`/creations/bundles/${encodeURIComponent(bundle.slug)}`}>
      <div className={`creation-visual visual-forest${image ? " has-media-backdrop" : ""}`} aria-hidden="true" style={mediaBackgroundStyle(image)}>
        {image ? (
          <img className="showcase-image" src={image} alt="" loading="lazy" data-image-position="center" />
        ) : (
          <>
            <span className="visual-cube cube-a"></span>
            <span className="visual-cube cube-b"></span>
            <span className="visual-cube cube-c"></span>
            <span className="visual-line"></span>
          </>
        )}
      </div>
      <div className="creation-content">
        <span className="content-tag">Bundle</span>
        <h3>{bundle.name}</h3>
        <p>{bundle.itemCount} création{bundle.itemCount > 1 ? "s" : ""}</p>
      </div>
    </a>
  );
}

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
          {loading ? (
            <LoadingState />
          ) : error || !data ? (
            <ErrorState />
          ) : data.bundles.length === 0 && data.creations.length === 0 ? (
            <div className="empty-state">
              <strong>Aucune creation publiee pour le moment.</strong>
              <p>Les prochains projets apparaitront ici des leur mise en ligne.</p>
            </div>
          ) : (
            <>
              {data.bundles.length > 0 ? (
                <div className="creations-grid creations-archive-grid creation-bundles-grid">
                  {data.bundles.map((bundle) => (
                    <BundleCard key={bundle.id} bundle={bundle} />
                  ))}
                </div>
              ) : null}
              {data.creations.length > 0 ? (
                <div className="creations-grid creations-archive-grid">
                  {data.creations.map((item, index) => (
                    <CreationCard key={item.id} item={item} index={index} archive />
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
