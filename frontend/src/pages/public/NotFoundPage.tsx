import { Layout } from "../../components/layout/Layout";
import { useI18n } from "../../i18n/useI18n";

export function NotFoundPage() {
  const { t } = useI18n();

  return (
    <Layout page="notFound">
      <section className="creation-detail-empty">
        <p className="eyebrow">{t("pages.notFound.eyebrow")}</p>
        <h1>{t("pages.notFound.heading")}</h1>
        <p>{t("pages.notFound.text")}</p>
        <a className="button button-primary" href="/">
          {t("pages.notFound.back")}
        </a>
      </section>
    </Layout>
  );
}
