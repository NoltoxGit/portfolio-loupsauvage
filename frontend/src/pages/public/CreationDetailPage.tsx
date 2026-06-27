import { getCreation } from "../../api/publicSite";
import { Gallery } from "../../components/content/Gallery";
import { SketchfabEmbed } from "../../components/content/SketchfabEmbed";
import { Layout } from "../../components/layout/Layout";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { useAsyncData } from "../../hooks/useAsyncData";

export function CreationDetailPage({ slug }: { slug: string }) {
  const { data, error, loading } = useAsyncData(() => getCreation(slug), [slug]);

  return (
    <Layout page="creationDetail">
      {loading ? (
        <section className="creation-detail-empty">
          <LoadingState />
        </section>
      ) : error || !data ? (
        <section className="creation-detail-empty">
          <p className="eyebrow">Creation introuvable</p>
          <h1>Cette creation n'existe pas encore</h1>
          <ErrorState label="Retourne au portfolio pour choisir une creation disponible." />
          <a className="button button-primary" href="/creations">
            Retour aux creations
          </a>
        </section>
      ) : (
        <>
          <section className="creation-detail-hero">
            <a className="text-link" href="/creations">
              Retour aux creations
            </a>
            <div className="creation-detail-layout">
              <Gallery item={data} />
              <div className="creation-detail-copy">
                <p className="eyebrow">{data.sourceContext === "private_commission" ? "Commission" : "Creation"}</p>
                <h1>{data.title}</h1>
                <p>{data.description || data.shortDescription}</p>
                <div className="creation-detail-actions">
                  <a className="button button-primary" href="/#discord">
                    Commander une creation
                  </a>
                  <a className="button button-secondary" href="/creations">
                    Portfolio
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section className="section creation-model-section" aria-labelledby="creation-model-title">
            <div className="section-inner">
              <div className="section-heading">
                <p className="eyebrow">Modele 3D</p>
                <h2 id="creation-model-title">Apercu Sketchfab</h2>
              </div>
              <SketchfabEmbed title={data.title} url={data.sketchfabUrl} />
            </div>
          </section>
        </>
      )}
    </Layout>
  );
}
