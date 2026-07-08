import { useMemo, useState } from "react";
import { getCreationBundle } from "../../api/publicSite";
import { CreationMediaViewer } from "../../components/content/CreationMediaViewer";
import { mediaBackgroundStyle, modelPreviewImagePath, primaryImagePath } from "../../components/content/media";
import { Layout } from "../../components/layout/Layout";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { useAsyncData } from "../../hooks/useAsyncData";

export function CreationBundlePage({ slug }: { slug: string }) {
  const { data, error, loading } = useAsyncData(() => getCreationBundle(slug), [slug]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const activeItem = useMemo(() => {
    if (!data || data.items.length === 0) {
      return null;
    }

    return data.items.find((item) => item.id === activeId) ?? data.items[0];
  }, [activeId, data]);

  return (
    <Layout page="creationDetail">
      {loading ? (
        <section className="creation-detail-empty">
          <LoadingState />
        </section>
      ) : error || !data ? (
        <section className="creation-detail-empty">
          <p className="eyebrow">Bundle</p>
          <h1>Bundle introuvable</h1>
          <ErrorState label="Ce bundle n’existe pas ou n’est pas accessible." />
          <a className="button button-primary" href="/creations">
            Retour aux créations
          </a>
        </section>
      ) : data.items.length === 0 || !activeItem ? (
        <section className="creation-detail-empty">
          <p className="eyebrow">Bundle</p>
          <h1>{data.name}</h1>
          <p>Ce bundle ne contient pas encore de création publiée.</p>
          <a className="button button-primary" href="/creations">
            Retour aux créations
          </a>
        </section>
      ) : (
        <section className="bundle-page">
          <a className="text-link" href="/creations">
            Retour aux créations
          </a>
          <div className="bundle-heading">
            <p className="eyebrow">{data.visibility === "unlisted" ? "Bundle non listé" : "Bundle"}</p>
            <h1>{data.name}</h1>
            <p>{data.itemCount} création{data.itemCount > 1 ? "s" : ""}</p>
          </div>
          <div className="bundle-layout">
            <article className="bundle-active">
              <CreationMediaViewer item={activeItem} />
              <div className="bundle-active-copy">
                <h2>{activeItem.title}</h2>
                <p>{activeItem.shortDescription}</p>
                <a className="button button-secondary" href={`/creations/${encodeURIComponent(activeItem.slug)}`}>
                  Ouvrir la fiche
                </a>
              </div>
            </article>
            <aside className="bundle-sidebar" aria-label={`Créations de ${data.name}`}>
              {data.items.map((item, index) => {
                const image = primaryImagePath(item) || modelPreviewImagePath(item);

                return (
                  <button
                    key={item.id}
                    className={`bundle-item${item.id === activeItem.id ? " is-active" : ""}`}
                    type="button"
                    onClick={() => setActiveId(item.id)}
                  >
                    <span className="bundle-item-index">{index + 1}</span>
                    <span className="bundle-item-thumb" style={mediaBackgroundStyle(image)} aria-hidden="true">
                      {image ? <img src={image} alt="" loading="lazy" /> : null}
                    </span>
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.shortDescription || "Création portfolio"}</small>
                    </span>
                  </button>
                );
              })}
            </aside>
          </div>
        </section>
      )}
    </Layout>
  );
}
