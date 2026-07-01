import { getCreation } from "../../api/publicSite";
import { CreationMediaViewer } from "../../components/content/CreationMediaViewer";
import { sourceContextLabel } from "../../components/content/media";
import { Layout } from "../../components/layout/Layout";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { useAsyncData } from "../../hooks/useAsyncData";
import { useI18n } from "../../i18n/useI18n";

export function CreationDetailPage({ slug }: { slug: string }) {
  const { t } = useI18n();
  const { data, error, loading } = useAsyncData(() => getCreation(slug), [slug]);

  return (
    <Layout page="creationDetail">
      {loading ? (
        <section className="creation-detail-empty">
          <LoadingState />
        </section>
      ) : error || !data ? (
        <section className="creation-detail-empty">
          <p className="eyebrow">{t("pages.creationDetail.emptyEyebrow")}</p>
          <h1>{t("pages.creationDetail.emptyTitle")}</h1>
          <ErrorState label={t("pages.creationDetail.emptyText")} />
          <a className="button button-primary" href="/creations">
            {t("pages.creationDetail.back")}
          </a>
        </section>
      ) : (
        <>
          <section className="creation-detail-hero">
            <a className="text-link" href="/creations">
              {t("pages.creationDetail.back")}
            </a>
            <div className="creation-detail-layout">
              <CreationMediaViewer item={data} />
              <div className="creation-detail-copy">
                <p className="eyebrow">{sourceContextLabel(data, t("cards.commission"), t("cards.creation"))}</p>
                <h1>{data.title}</h1>
                <p>{data.description || data.shortDescription}</p>
                <div className="creation-detail-actions">
                  <a className="button button-primary" href="/#discord">
                    {t("pages.creationDetail.order")}
                  </a>
                  <a className="button button-secondary" href="/creations">
                    {t("pages.creationDetail.backShort")}
                  </a>
                </div>
              </div>
            </div>
          </section>

        </>
      )}
    </Layout>
  );
}
