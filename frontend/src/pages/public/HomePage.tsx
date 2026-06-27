import { getSite } from "../../api/publicSite";
import { CreationCard } from "../../components/content/CreationCard";
import { MarketplaceCard } from "../../components/content/MarketplaceCard";
import { Layout } from "../../components/layout/Layout";
import { PricingCard } from "../../components/pricing/PricingCard";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { useAsyncData } from "../../hooks/useAsyncData";

export function HomePage() {
  const { data, error, loading } = useAsyncData(getSite, []);

  return (
    <Layout page="home">
      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">Modelisation Minecraft sur mesure</p>
          <h1 id="hero-title">LoupSauvage</h1>
          <p className="hero-lead">Modeles Minecraft custom, packs et assets prets a integrer.</p>
          <p className="hero-text">Une DA blocky soignee pour serveurs, maps, boutiques et projets creatifs.</p>
          <div className="hero-actions" aria-label="Actions principales">
            <a className="button button-primary" href="#discord">
              Me contacter sur Discord
            </a>
            <a className="button button-secondary" href="/creations">
              Voir mes creations
            </a>
          </div>
        </div>

        <div className="hero-art" aria-label="Personnage Minecraft stylise">
          <div className="flat-shape shape-yellow" aria-hidden="true"></div>
          <div className="flat-shape shape-green" aria-hidden="true"></div>
          <div className="pixel-stack stack-one" aria-hidden="true"></div>
          <div className="pixel-stack stack-two" aria-hidden="true"></div>
          <img className="hero-character" src="/assets/hero-zordix.webp" alt="Personnage Minecraft LoupSauvage en tenue bleue et jaune" />
        </div>
      </section>

      <section className="section section-muted" id="creations" aria-labelledby="creations-title">
        <div className="section-inner">
          <div className="section-heading">
            <p className="eyebrow">Portfolio</p>
            <h2 id="creations-title">Creations</h2>
            <p>Un apercu de mes dernieres creations, entre modeles personnalises, biomes, packs forestiers et assets prets a integrer.</p>
          </div>
          {loading ? <LoadingState /> : error || !data ? <ErrorState /> : <div className="creations-grid">{data.latestCreations.map((item, index) => <CreationCard key={item.id} item={item} index={index} />)}</div>}
          <div className="section-action">
            <a className="button button-dark" href="/creations">
              Voir toutes les creations
            </a>
          </div>
        </div>
      </section>

      <section className="section process-section" id="process" aria-labelledby="process-title">
        <div className="section-inner">
          <div className="section-heading">
            <p className="eyebrow">Process</p>
            <h2 id="process-title">Comment ca se passe ?</h2>
            <p>Un fonctionnement simple pour transformer une idee en modele Minecraft propre, lisible et pret a rejoindre ton projet.</p>
          </div>
          <div className="process-grid">
            {[
              ["01", "Brief Discord", "On pose l'idee, le style, les references et le niveau de detail attendu."],
              ["02", "Modelisation", "Le modele prend forme avec une silhouette claire, des textures et des retours."],
              ["03", "Livraison", "Tu recuperes un asset propre, pense pour ton serveur, ta map ou ta boutique."],
            ].map(([step, title, text]) => (
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
            <p className="eyebrow">Commandes</p>
            <h2 id="tarifs-title">Tarifs</h2>
            <p>Chaque projet est different. Les tarifs s'adaptent a la complexite du modele, au niveau de detail et au nombre d'assets souhaites.</p>
          </div>
          {loading ? <LoadingState /> : error || !data ? <ErrorState /> : <div className="pricing-grid">{data.pricing.map((plan, index) => <PricingCard key={plan.id} plan={plan} index={index} />)}</div>}
        </div>
      </section>

      <section className="section marketplace-section" id="marketplace" aria-labelledby="marketplace-title">
        <div className="section-inner marketplace-layout">
          <div className="marketplace-copy">
            <p className="eyebrow">Best sellers</p>
            <h2 id="marketplace-title">Les packs les plus demandes</h2>
            <p>Une selection des modeles et packs qui plaisent le plus aux serveurs, createurs et projets communautaires Minecraft.</p>
            <a className="button button-primary" href="#discord">
              Commander un best seller
            </a>
          </div>
          {loading ? <LoadingState /> : error || !data ? <ErrorState /> : <div className="marketplace-products">{data.marketplace.map((item) => <MarketplaceCard key={item.id} item={item} />)}</div>}
        </div>
      </section>

      <section className="discord-cta" id="discord" aria-labelledby="discord-title">
        <div className="discord-copy">
          <p className="eyebrow">Contact</p>
          <h2 id="discord-title">Une idee de modele ou de pack ?</h2>
          <p>Les commandes, devis et ajustements passent simplement par Discord pour discuter du projet, du style et du niveau de detail.</p>
        </div>
        <a className="button button-contrast" href="https://discord.gg/TtQK9rnwv3" target="_blank" rel="noreferrer">
          Rejoindre le Discord
        </a>
      </section>
    </Layout>
  );
}
