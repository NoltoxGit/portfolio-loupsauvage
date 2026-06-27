import { getCreations } from "../../api/publicSite";
import { CreationCard } from "../../components/content/CreationCard";
import { Layout } from "../../components/layout/Layout";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { useAsyncData } from "../../hooks/useAsyncData";

export function CreationsPage() {
  const { data, error, loading } = useAsyncData(getCreations, []);

  return (
    <Layout page="creations">
      <section className="archive-hero" id="top" aria-labelledby="archive-title">
        <div className="archive-hero-copy">
          <p className="eyebrow">Portfolio complet</p>
          <h1 id="archive-title">Toutes les creations</h1>
          <p>Packs thematiques, modeles custom, assets decoratifs et idees pretes a rejoindre un serveur Minecraft avec une identite visuelle forte.</p>
          <div className="archive-actions">
            <a className="button button-primary" href="/#discord">
              Commander une creation
            </a>
            <a className="button button-secondary" href="/#top">
              Retour a l'accueil
            </a>
          </div>
        </div>
      </section>

      <section className="section archive-section" id="creations" aria-labelledby="archive-grid-title">
        <div className="section-inner">
          <div className="section-heading">
            <p className="eyebrow">Galerie</p>
            <h2 id="archive-grid-title">Creations disponibles</h2>
            <p>Survole une creation pour afficher ses infos, son type et l'appel a commande.</p>
          </div>
          {loading ? <LoadingState /> : error || !data ? <ErrorState /> : <div className="creations-grid creations-archive-grid">{data.map((item, index) => <CreationCard key={item.id} item={item} index={index} archive />)}</div>}
        </div>
      </section>
    </Layout>
  );
}
