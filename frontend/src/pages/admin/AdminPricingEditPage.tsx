import { useEffect } from "react";
import { getAdminPricing } from "../../api/admin";
import { navigateTo } from "../../app/navigation";
import { AdminError, isUnauthenticatedError } from "../../components/admin/AdminError";
import { PricingForm } from "../../components/admin/PricingForm";
import { LoadingState } from "../../components/state/LoadingState";
import { useAsyncData } from "../../hooks/useAsyncData";
import type { AdminPricingPlan } from "../../types/admin";

export function AdminPricingEditPage({
  id,
  csrfToken,
  onUnauthenticated,
}: {
  id?: number;
  csrfToken: string;
  onUnauthenticated: () => void;
}) {
  const isNew = id === undefined;
  const { data, error, loading } = useAsyncData<AdminPricingPlan>(() => {
    if (id === undefined) {
      return Promise.resolve(null as unknown as AdminPricingPlan);
    }

    return getAdminPricing(id);
  }, [id]);

  useEffect(() => {
    if (isUnauthenticatedError(error)) {
      onUnauthenticated();
    }
  }, [error, onUnauthenticated]);

  const onSaved = (plan: AdminPricingPlan) => {
    if (isNew) {
      navigateTo(`/admin/pricing/${plan.id}`);
    }
  };

  return (
    <>
      <div className="admin-panel-heading admin-heading-actions">
        <div>
          <p className="eyebrow">Tarifs</p>
          <h2>{isNew ? "Nouvelle offre" : "Édition offre"}</h2>
          <p>Les fonctionnalités sont éditées avec une ligne par élément.</p>
        </div>
        <button className="button button-secondary" type="button" onClick={() => navigateTo("/admin/pricing")}>
          Retour
        </button>
      </div>

      {!isNew && loading ? <LoadingState label="Chargement de l'offre..." /> : null}
      <AdminError error={error} />

      {(isNew || data) && !loading ? (
        <PricingForm
          csrfToken={csrfToken}
          initialPlan={isNew ? null : data}
          onSaved={onSaved}
          onUnauthenticated={onUnauthenticated}
        />
      ) : null}
    </>
  );
}
