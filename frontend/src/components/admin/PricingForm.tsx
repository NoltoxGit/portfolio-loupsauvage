import { FormEvent, useEffect, useState } from "react";
import { createAdminPricing, updateAdminPricing, updateAdminPricingActive } from "../../api/admin";
import type { AdminPricingPayload, AdminPricingPlan } from "../../types/admin";
import { AdminError, isUnauthenticatedError } from "./AdminError";

interface PricingFormState {
  slug: string;
  title: string;
  subtitle: string;
  priceLabel: string;
  description: string;
  featuresText: string;
  sortOrder: string;
  isActive: boolean;
}

const defaultState: PricingFormState = {
  slug: "",
  title: "",
  subtitle: "",
  priceLabel: "",
  description: "",
  featuresText: "",
  sortOrder: "0",
  isActive: true,
};

function stateFromPlan(plan: AdminPricingPlan): PricingFormState {
  return {
    slug: plan.slug,
    title: plan.title,
    subtitle: plan.subtitle ?? "",
    priceLabel: plan.priceLabel,
    description: plan.description ?? "",
    featuresText: plan.features.join("\n"),
    sortOrder: String(plan.sortOrder),
    isActive: plan.isActive,
  };
}

function trimOrNull(value: string) {
  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
}

export function PricingForm({
  csrfToken,
  initialPlan,
  onSaved,
  onUnauthenticated,
}: {
  csrfToken: string;
  initialPlan?: AdminPricingPlan | null;
  onSaved: (plan: AdminPricingPlan) => void;
  onUnauthenticated: () => void;
}) {
  const [form, setForm] = useState<PricingFormState>(() => (initialPlan ? stateFromPlan(initialPlan) : defaultState));
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(initialPlan ? stateFromPlan(initialPlan) : defaultState);
    setError(null);
    setNotice(null);
  }, [initialPlan]);

  const updateField = <K extends keyof PricingFormState>(key: K, value: PricingFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const payload = (): AdminPricingPayload => ({
    slug: form.slug,
    title: form.title,
    subtitle: trimOrNull(form.subtitle),
    priceLabel: form.priceLabel,
    description: trimOrNull(form.description),
    features: form.featuresText
      .split("\n")
      .map((feature) => feature.trim())
      .filter(Boolean),
    sortOrder: Number.parseInt(form.sortOrder, 10) || 0,
    isActive: form.isActive,
  });

  const handleError = (nextError: unknown) => {
    if (isUnauthenticatedError(nextError)) {
      onUnauthenticated();
      return;
    }

    setError(nextError);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const saved = initialPlan
        ? await updateAdminPricing(initialPlan.id, payload(), csrfToken)
        : await createAdminPricing(payload(), csrfToken);

      setForm(stateFromPlan(saved));
      setNotice("Offre enregistrée.");
      onSaved(saved);
    } catch (nextError) {
      handleError(nextError);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async () => {
    if (!initialPlan) {
      updateField("isActive", !form.isActive);
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const saved = await updateAdminPricingActive(initialPlan.id, { isActive: !form.isActive }, csrfToken);
      setForm(stateFromPlan(saved));
      setNotice(saved.isActive ? "Offre activée." : "Offre désactivée.");
      onSaved(saved);
    } catch (nextError) {
      handleError(nextError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <div className="admin-form-grid">
        <label className="admin-field" htmlFor="pricing-title">
          <span>Titre</span>
          <input
            id="pricing-title"
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
            required
          />
        </label>

        <label className="admin-field" htmlFor="pricing-slug">
          <span>Slug</span>
          <input
            id="pricing-slug"
            value={form.slug}
            onChange={(event) => updateField("slug", event.target.value)}
            required
          />
        </label>

        <label className="admin-field" htmlFor="pricing-subtitle">
          <span>Sous-titre</span>
          <input
            id="pricing-subtitle"
            value={form.subtitle}
            onChange={(event) => updateField("subtitle", event.target.value)}
          />
        </label>

        <label className="admin-field" htmlFor="pricing-price-label">
          <span>Libellé du prix</span>
          <input
            id="pricing-price-label"
            value={form.priceLabel}
            onChange={(event) => updateField("priceLabel", event.target.value)}
            required
          />
        </label>

        <label className="admin-field" htmlFor="pricing-sort-order">
          <span>Ordre</span>
          <input
            id="pricing-sort-order"
            type="number"
            value={form.sortOrder}
            onChange={(event) => updateField("sortOrder", event.target.value)}
          />
        </label>

        <label className="admin-check-field" htmlFor="pricing-is-active">
          <input
            id="pricing-is-active"
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => updateField("isActive", event.target.checked)}
          />
          Offre active
        </label>

        <label className="admin-field admin-field-wide" htmlFor="pricing-description">
          <span>Description</span>
          <textarea
            id="pricing-description"
            rows={5}
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
          />
        </label>

        <label className="admin-field admin-field-wide" htmlFor="pricing-features">
          <span>Fonctionnalités</span>
          <textarea
            id="pricing-features"
            rows={7}
            value={form.featuresText}
            onChange={(event) => updateField("featuresText", event.target.value)}
          />
          <small>Une fonctionnalité par ligne.</small>
        </label>
      </div>

      <AdminError error={error} />
      {notice ? <p className="admin-status is-visible">{notice}</p> : null}

      <div className="admin-form-actions">
        <button className="button button-primary" type="submit" disabled={submitting}>
          {submitting ? "Enregistrement..." : "Enregistrer"}
        </button>
        <button className="button button-secondary" type="button" disabled={submitting} onClick={toggleActive}>
          {form.isActive ? "Désactiver" : "Activer"}
        </button>
      </div>
    </form>
  );
}
