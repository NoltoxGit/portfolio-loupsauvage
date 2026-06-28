import { useEffect } from "react";
import { getAdminDashboard } from "../../api/admin";
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
        <h2>Vue admin</h2>
        <p>Connecté en tant que {session.user.username}. Les compteurs viennent de l'API admin protégée.</p>
      </div>

      {loading ? <LoadingState label="Chargement du dashboard admin..." /> : null}
      <AdminError error={error} />

      {data ? (
        <div className="admin-summary-grid">
          <article className="admin-summary-card">
            <span>Total contenus</span>
            <strong>{data.content.total}</strong>
            <p>{data.content.published} publiés</p>
          </article>
          <article className="admin-summary-card">
            <span>Brouillons</span>
            <strong>{data.content.draft}</strong>
            <p>{data.content.archived} archivés</p>
          </article>
          <article className="admin-summary-card">
            <span>Créations</span>
            <strong>{data.content.creations}</strong>
            <p>{data.content.marketplace} marketplace</p>
          </article>
          <article className="admin-summary-card">
            <span>Offres actives</span>
            <strong>{data.pricing.active}</strong>
            <p>{data.pricing.inactive} inactifs</p>
          </article>
        </div>
      ) : null}
    </>
  );
}
