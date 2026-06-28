import { useEffect } from "react";
import { getAdminDashboard } from "../../api/admin";
import { navigateTo } from "../../app/navigation";
import { AdminError, isUnauthenticatedError } from "../../components/admin/AdminError";
import { LoadingState } from "../../components/state/LoadingState";
import { useAsyncData } from "../../hooks/useAsyncData";
import type { AuthSession } from "../../types/auth";

export function DashboardPage({
  session,
  onUnauthenticated,
}: {
  session: AuthSession;
  onUnauthenticated: () => void;
}) {
  const { data, error, loading } = useAsyncData(getAdminDashboard, []);

  useEffect(() => {
    if (isUnauthenticatedError(error)) {
      onUnauthenticated();
    }
  }, [error, onUnauthenticated]);

  return (
    <>
      <div className="admin-panel-heading">
        <p className="eyebrow">Tableau de bord</p>
        <h2>Bonjour {session.user.username}</h2>
        <p>Retrouve ici les contenus à préparer, les éléments déjà en ligne et les raccourcis utiles.</p>
      </div>

      {loading ? <LoadingState label="Chargement du tableau de bord..." /> : null}
      <AdminError error={error} />

      {data ? (
        <>
          <div className="admin-summary-grid">
            <article className="admin-summary-card is-actionable">
              <span>À préparer</span>
              <strong>{data.content.draft}</strong>
              <p>contenus en brouillon</p>
            </article>
            <article className="admin-summary-card">
              <span>En ligne</span>
              <strong>{data.content.published}</strong>
              <p>contenus visibles sur le site</p>
            </article>
            <article className="admin-summary-card">
              <span>Portfolio</span>
              <strong>{data.content.creations}</strong>
              <p>créations et projets artistiques</p>
            </article>
            <article className="admin-summary-card">
              <span>Marketplace</span>
              <strong>{data.content.marketplace}</strong>
              <p>ressources et produits publiés</p>
            </article>
          </div>

          <div className="admin-dashboard-actions">
            <article className="admin-action-card is-creation">
              <div>
                <span>Portfolio</span>
                <h3>Ajouter une création</h3>
                <p>Pour une œuvre personnelle, un rendu ou une commission publiée avec accord.</p>
              </div>
              <button className="button button-primary" type="button" onClick={() => navigateTo("/admin/creations/new")}>
                Nouvelle création
              </button>
            </article>

            <article className="admin-action-card is-marketplace">
              <div>
                <span>Marketplace</span>
                <h3>Ajouter une ressource</h3>
                <p>Pour un produit publié sur BuiltByBit, MCModels, Sketchfab ou une autre plateforme.</p>
              </div>
              <button className="button button-primary" type="button" onClick={() => navigateTo("/admin/marketplace/new")}>
                Nouvelle ressource
              </button>
            </article>

            <article className="admin-action-card">
              <div>
                <span>Tarifs</span>
                <h3>Mettre à jour les offres</h3>
                <p>{data.pricing.active} offres actives, {data.pricing.inactive} désactivées.</p>
              </div>
              <button className="button button-secondary" type="button" onClick={() => navigateTo("/admin/pricing")}>
                Voir les tarifs
              </button>
            </article>
          </div>
        </>
      ) : null}
    </>
  );
}
