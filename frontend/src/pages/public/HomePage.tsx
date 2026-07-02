import { getSite } from "../../api/publicSite";
import { CreationCard } from "../../components/content/CreationCard";
import { MarketplaceCard } from "../../components/content/MarketplaceCard";
import { Layout } from "../../components/layout/Layout";
import { PricingCard } from "../../components/pricing/PricingCard";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { useAsyncData } from "../../hooks/useAsyncData";
import { useI18n } from "../../i18n/useI18n";

export function HomePage() {
  const { t } = useI18n();
  const { data, error, loading } = useAsyncData(getSite, []);
  const processSteps = [
    ["01", t("pages.home.processOneTitle"), t("pages.home.processOneText")],
    ["02", t("pages.home.processTwoTitle"), t("pages.home.processTwoText")],
    ["03", t("pages.home.processThreeTitle"), t("pages.home.processThreeText")],
  ];

  return (
    <Layout page="home">
      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">{t("pages.home.heroEyebrow")}</p>
          <h1 id="hero-title">LoupSauvage</h1>
          <p className="hero-lead">{t("pages.home.heroLead")}</p>
          <p className="hero-text">{t("pages.home.heroText")}</p>
          <div className="hero-actions" aria-label={t("pages.home.heroActions")}>
            <a className="button button-primary" href="#discord">
              {t("pages.home.heroContact")}
            </a>
            <a className="button button-secondary" href="/creations">
              {t("pages.home.heroCreations")}
            </a>
          </div>
        </div>

        <div className="hero-art" aria-label={t("ui.heroArt")}>
          <div className="flat-shape shape-yellow" aria-hidden="true"></div>
          <div className="flat-shape shape-green" aria-hidden="true"></div>
          <div className="pixel-stack stack-one" aria-hidden="true"></div>
          <div className="pixel-stack stack-two" aria-hidden="true"></div>
          <img className="hero-character" src="/assets/hero-zordix.webp" alt={t("ui.heroAlt")} />
        </div>
      </section>

      <section className="section section-muted" id="creations" aria-labelledby="creations-title">
        <div className="section-inner">
          <div className="section-heading">
            <p className="eyebrow">{t("pages.home.creationsEyebrow")}</p>
            <h2 id="creations-title">{t("pages.home.creationsTitle")}</h2>
            <p>{t("pages.home.creationsText")}</p>
          </div>
          {loading ? (
            <LoadingState />
          ) : error || !data ? (
            <ErrorState />
          ) : data.latestCreations.length === 0 ? (
            <div className="empty-state">
              <strong>Aucune creation publiee.</strong>
              <p>Cette section se remplira avec les prochaines mises en ligne.</p>
            </div>
          ) : (
            <div className="creations-grid">
              {data.latestCreations.map((item, index) => (
                <CreationCard key={item.id} item={item} index={index} />
              ))}
            </div>
          )}
          <div className="section-action">
            <a className="button button-dark" href="/creations">
              {t("pages.home.creationsAll")}
            </a>
          </div>
        </div>
      </section>

      <section className="section process-section" id="process" aria-labelledby="process-title">
        <div className="section-inner">
          <div className="section-heading">
            <p className="eyebrow">{t("pages.home.processEyebrow")}</p>
            <h2 id="process-title">{t("pages.home.processTitle")}</h2>
            <p>{t("pages.home.processText")}</p>
          </div>
          <div className="process-grid">
            {processSteps.map(([step, title, text]) => (
              <article className="process-card" key={step}>
                <span className="process-step">{step}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="tarifs" aria-labelledby="tarifs-title">
        <div className="section-inner">
          <div className="section-heading">
            <p className="eyebrow">{t("pages.home.pricingEyebrow")}</p>
            <h2 id="tarifs-title">{t("pages.home.pricingTitle")}</h2>
            <p>{t("pages.home.pricingText")}</p>
          </div>
          {loading ? (
            <LoadingState />
          ) : error || !data ? (
            <ErrorState />
          ) : data.pricing.length === 0 ? (
            <div className="empty-state">
              <strong>Aucune offre active.</strong>
              <p>Les tarifs reviendront ici quand une offre sera publiee.</p>
            </div>
          ) : (
            <div className="pricing-grid">
              {data.pricing.map((plan, index) => (
                <PricingCard key={plan.id} plan={plan} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section marketplace-section" id="marketplace" aria-labelledby="marketplace-title">
        <div className="section-inner marketplace-layout">
          <div className="marketplace-copy">
            <p className="eyebrow">{t("pages.home.bestEyebrow")}</p>
            <h2 id="marketplace-title">{t("pages.home.bestTitle")}</h2>
            <p>{t("pages.home.bestText")}</p>
            <a className="button button-primary" href="#discord">
              {t("pages.home.bestCta")}
            </a>
          </div>
          {loading ? (
            <LoadingState />
          ) : error || !data ? (
            <ErrorState />
          ) : data.marketplace.length === 0 ? (
            <div className="empty-state">
              <strong>Aucune ressource marketplace publiee.</strong>
              <p>Les packs disponibles apparaitront ici une fois mis en ligne.</p>
            </div>
          ) : (
            <div className="marketplace-products">
              {data.marketplace.map((item) => (
                <MarketplaceCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="discord-cta" id="discord" aria-labelledby="discord-title">
        <div className="discord-copy">
          <p className="eyebrow">{t("pages.home.contactEyebrow")}</p>
          <h2 id="discord-title">{t("pages.home.contactTitle")}</h2>
          <p>{t("pages.home.contactText")}</p>
        </div>
        <a className="button button-contrast" href="https://discord.gg/TtQK9rnwv3" target="_blank" rel="noreferrer">
          {t("pages.home.contactCta")}
        </a>
      </section>
    </Layout>
  );
}
