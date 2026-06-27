import { getPricing } from "../../api/publicSite";
import { Layout } from "../../components/layout/Layout";
import { PricingCard } from "../../components/pricing/PricingCard";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { useAsyncData } from "../../hooks/useAsyncData";

export function PricingPage() {
  const { data, error, loading } = useAsyncData(getPricing, []);

  return (
    <Layout page="pricing">
      <section className="archive-hero" id="top" aria-labelledby="pricing-page-title">
        <div className="archive-hero-copy">
          <p className="eyebrow">Commandes</p>
          <h1 id="pricing-page-title">Tarifs</h1>
          <p>Chaque projet est different. Les offres peuvent etre ajustees selon la complexite du modele et le nombre d'assets.</p>
        </div>
      </section>

      <section className="section" aria-labelledby="pricing-grid-title">
        <div className="section-inner">
          <div className="section-heading">
            <p className="eyebrow">Offres</p>
            <h2 id="pricing-grid-title">Prestations disponibles</h2>
          </div>
          {loading ? <LoadingState /> : error || !data ? <ErrorState /> : <div className="pricing-grid">{data.map((plan, index) => <PricingCard key={plan.id} plan={plan} index={index} />)}</div>}
        </div>
      </section>
    </Layout>
  );
}
