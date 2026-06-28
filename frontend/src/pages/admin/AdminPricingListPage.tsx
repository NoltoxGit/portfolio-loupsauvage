import { useEffect, useState } from "react";
import { listAdminPricing, updateAdminPricingActive } from "../../api/admin";
import { navigateTo } from "../../app/navigation";
import { AdminError, isUnauthenticatedError } from "../../components/admin/AdminError";
import { LoadingState } from "../../components/state/LoadingState";
import { useAsyncData } from "../../hooks/useAsyncData";

export function AdminPricingListPage({
  csrfToken,
  onUnauthenticated,
}: {
  csrfToken: string;
  onUnauthenticated: () => void;
}) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionError, setActionError] = useState<unknown>(null);
  const { data, error, loading } = useAsyncData(listAdminPricing, [refreshKey]);

  useEffect(() => {
    if (isUnauthenticatedError(error) || isUnauthenticatedError(actionError)) {
      onUnauthenticated();
    }
  }, [actionError, error, onUnauthenticated]);

  const toggleActive = async (id: number, isActive: boolean) => {
    setActionError(null);

    try {
      await updateAdminPricingActive(id, { isActive: !isActive }, csrfToken);
      setRefreshKey((current) => current + 1);
    } catch (nextError) {
      if (isUnauthenticatedError(nextError)) {
        onUnauthenticated();
        return;
      }

      setActionError(nextError);
    }
  };

  return (
    <>
      <div className="admin-panel-heading admin-heading-actions">
        <div>
          <p className="eyebrow">Tarifs</p>
          <h2>Offres</h2>
          <p>Gestion des plans visibles via l'API publique quand ils sont actifs.</p>
        </div>
        <button className="button button-primary" type="button" onClick={() => navigateTo("/admin/pricing/new")}>
          Nouveau
        </button>
      </div>

      {loading ? <LoadingState label="Chargement des offres..." /> : null}
      <AdminError error={error ?? actionError} />

      {!loading && data?.length === 0 ? <p className="admin-empty">Aucune offre pricing.</p> : null}

      {data?.length ? (
        <div className="admin-list">
          {data.map((plan) => (
            <article className="admin-list-item" key={plan.id}>
              <div className="admin-list-icon">{plan.isActive ? "actif" : "inactif"}</div>
              <div className="admin-list-copy">
                <span>{plan.slug}</span>
                <h3>{plan.title}</h3>
                <p>
                  {plan.priceLabel} · ordre {plan.sortOrder}
                </p>
              </div>
              <div className="admin-list-actions">
                <button className="admin-mini-button" type="button" onClick={() => navigateTo(`/admin/pricing/${plan.id}`)}>
                  Éditer
                </button>
                <button
                  className="admin-mini-button"
                  type="button"
                  onClick={() => void toggleActive(plan.id, plan.isActive)}
                >
                  {plan.isActive ? "Désactiver" : "Activer"}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </>
  );
}
