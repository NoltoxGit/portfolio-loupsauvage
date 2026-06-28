import { getPricing } from "../../api/publicSite";
import { Layout } from "../../components/layout/Layout";
import { PricingCard } from "../../components/pricing/PricingCard";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { useAsyncData } from "../../hooks/useAsyncData";
import { useI18n } from "../../i18n/useI18n";

export function PricingPage() {
  const { t } = useI18n();
  const { data, error, loading } = useAsyncData(getPricing, []);

  return (
    <Layout page="pricing">
      <section className="archive-hero" id="top" aria-labelledby="pricing-page-title">
        <div className="archive-hero-copy">
          <p className="eyebrow">{t("pages.pricing.eyebrow")}</p>
          <h1 id="pricing-page-title">{t("pages.pricing.heading")}</h1>
          <p>{t("pages.pricing.text")}</p>
        </div>
      </section>

      <section className="section" aria-labelledby="pricing-grid-title">
        <div className="section-inner">
          <div className="section-heading">
            <p className="eyebrow">{t("pages.pricing.gridEyebrow")}</p>
            <h2 id="pricing-grid-title">{t("pages.pricing.gridTitle")}</h2>
          </div>
          {loading ? <LoadingState /> : error || !data ? <ErrorState /> : <div className="pricing-grid">{data.map((plan, index) => <PricingCard key={plan.id} plan={plan} index={index} />)}</div>}
        </div>
      </section>
    </Layout>
  );
}
