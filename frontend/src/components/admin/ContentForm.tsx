import { FormEvent, ReactNode, useEffect, useState } from "react";
import {
  archiveAdminContent,
  createAdminContent,
  updateAdminContent,
  updateAdminContentStatus,
} from "../../api/admin";
import type { AdminContentItem, AdminContentPayload } from "../../types/admin";
import type { ContentStatus, ContentType, ExternalPlatform, SourceContext } from "../../types/content";
import { AdminError, isUnauthenticatedError } from "./AdminError";
import { MediaManager } from "./MediaManager";

const statuses: ContentStatus[] = ["draft", "published", "archived"];
const externalPlatforms: ExternalPlatform[] = ["builtbybit", "mcmodels", "sketchfab", "other"];

const statusLabels: Record<ContentStatus, string> = {
  draft: "Brouillon",
  published: "En ligne",
  archived: "Archivé",
};

const sourceLabels: Record<SourceContext, string> = {
  personal: "Création personnelle",
  private_commission: "Commission ou projet privé",
  marketplace_product: "Ressource marketplace",
  other: "Autre",
};

const platformLabels: Record<ExternalPlatform, string> = {
  builtbybit: "BuiltByBit",
  mcmodels: "MCModels",
  sketchfab: "Sketchfab",
  other: "Autre",
};

interface ContentFormState {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  status: ContentStatus;
  sourceContext: SourceContext;
  sourceLabel: string;
  clientPermission: boolean;
  sketchfabUrl: string;
  externalUrl: string;
  externalPlatform: ExternalPlatform | "";
  platformLabel: string;
  priceLabel: string;
  sortOrder: string;
  publishedAt: string;
  displayDate: string;
}

function toInputDateTime(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value.replace(" ", "T").slice(0, 16);
}

function fromInputDateTime(value: string) {
  if (!value.trim()) {
    return null;
  }

  const normalized = value.trim().replace("T", " ");

  return normalized.length === 16 ? `${normalized}:00` : normalized;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function nowInputDateTime() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;

  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
}

function displayDateToDateTime(value: string | null | undefined) {
  return value ? `${value}T00:00` : "";
}

function defaultState(contentType: ContentType): ContentFormState {
  const currentDate = todayDate();

  return {
    title: "",
    slug: "",
    shortDescription: "",
    description: "",
    status: "draft",
    sourceContext: contentType === "marketplace" ? "marketplace_product" : "personal",
    sourceLabel: "",
    clientPermission: false,
    sketchfabUrl: "",
    externalUrl: "",
    externalPlatform: contentType === "marketplace" ? "other" : "",
    platformLabel: "",
    priceLabel: "",
    sortOrder: "0",
    publishedAt: nowInputDateTime(),
    displayDate: currentDate,
  };
}

function stateFromItem(item: AdminContentItem): ContentFormState {
  return {
    title: item.title,
    slug: item.slug,
    shortDescription: item.shortDescription ?? "",
    description: item.description ?? "",
    status: item.status,
    sourceContext: item.sourceContext,
    sourceLabel: item.sourceLabel ?? "",
    clientPermission: item.clientPermission,
    sketchfabUrl: item.sketchfabUrl ?? "",
    externalUrl: item.externalUrl ?? "",
    externalPlatform: item.type === "marketplace" ? item.externalPlatform ?? "other" : item.externalPlatform ?? "",
    platformLabel: item.platformLabel ?? "",
    priceLabel: item.priceLabel ?? "",
    sortOrder: String(item.sortOrder),
    publishedAt: toInputDateTime(item.publishedAt) || displayDateToDateTime(item.displayDate),
    displayDate: item.displayDate ?? item.publishedAt?.slice(0, 10) ?? todayDate(),
  };
}

function trimOrNull(value: string) {
  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
}

function InfoTooltip({ label }: { label: string }) {
  return (
    <span className="admin-info-tooltip" tabIndex={0} aria-label={label}>
      !
    </span>
  );
}

function FieldTitle({ children, help }: { children: ReactNode; help: string }) {
  return (
    <span className="admin-field-title">
      {children}
      <InfoTooltip label={help} />
    </span>
  );
}

function SectionTitle({ children, help }: { children: ReactNode; help: string }) {
  return (
    <span className="admin-section-title">
      {children}
      <InfoTooltip label={help} />
    </span>
  );
}

export function ContentForm({
  contentType,
  csrfToken,
  initialItem,
  onSaved,
  onArchived,
  onUnauthenticated,
}: {
  contentType: ContentType;
  csrfToken: string;
  initialItem?: AdminContentItem | null;
  onSaved: (item: AdminContentItem) => void;
  onArchived?: (item: AdminContentItem) => void;
  onUnauthenticated: () => void;
}) {
  const isEdit = Boolean(initialItem);
  const isMarketplace = contentType === "marketplace";
  const [form, setForm] = useState<ContentFormState>(() =>
    initialItem ? stateFromItem(initialItem) : defaultState(contentType),
  );
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(() => Boolean(initialItem?.slug));
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(initialItem ? stateFromItem(initialItem) : defaultState(contentType));
    setSlugManuallyEdited(Boolean(initialItem?.slug));
    setError(null);
    setNotice(null);
  }, [contentType, initialItem]);

  const updateField = <K extends keyof ContentFormState>(key: K, value: ContentFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateTitle = (title: string) => {
    setForm((current) => ({
      ...current,
      title,
      slug: slugManuallyEdited ? current.slug : slugify(title),
    }));
  };

  const regenerateSlug = () => {
    setSlugManuallyEdited(false);
    setForm((current) => ({ ...current, slug: slugify(current.title) }));
  };

  const setSourceContext = (sourceContext: SourceContext) => {
    setForm((current) => ({
      ...current,
      sourceContext,
      clientPermission: sourceContext === "private_commission" ? current.clientPermission : false,
    }));
  };

  const toPayload = (): AdminContentPayload => {
    const sourceContext = isMarketplace ? "marketplace_product" : form.sourceContext;
    const publicationDate = form.publishedAt ? form.publishedAt.slice(0, 10) : form.displayDate || todayDate();

    return {
      type: contentType,
      title: form.title,
      slug: form.slug,
      shortDescription: trimOrNull(form.shortDescription),
      description: trimOrNull(form.description),
      status: form.status,
      sourceContext,
      sourceLabel: !isMarketplace && sourceContext === "other" ? trimOrNull(form.sourceLabel) : null,
      clientPermission: !isMarketplace && sourceContext === "private_commission" ? form.clientPermission : false,
      sketchfabUrl: isMarketplace ? null : trimOrNull(form.sketchfabUrl),
      externalUrl: trimOrNull(form.externalUrl),
      externalPlatform: form.externalPlatform === "" ? null : form.externalPlatform,
      platformLabel: isMarketplace && form.externalPlatform === "other" ? trimOrNull(form.platformLabel) : null,
      priceLabel: trimOrNull(form.priceLabel),
      sortOrder: Number.parseInt(form.sortOrder, 10) || 0,
      publishedAt: fromInputDateTime(form.publishedAt),
      displayDate: publicationDate,
    };
  };

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
      const saved =
        initialItem && isEdit
          ? await updateAdminContent(initialItem.id, toPayload(), csrfToken)
          : await createAdminContent(toPayload(), csrfToken);

      setForm(stateFromItem(saved));
      setSlugManuallyEdited(true);
      setNotice("Contenu enregistré.");
      onSaved(saved);
    } catch (nextError) {
      handleError(nextError);
    } finally {
      setSubmitting(false);
    }
  };

  const changeStatus = async (status: ContentStatus) => {
    if (!initialItem) {
      updateField("status", status);
      return;
    }

    if (status === "archived" && !window.confirm("Archiver ce contenu ? Il ne sera plus visible publiquement.")) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const saved = await updateAdminContentStatus(initialItem.id, { status }, csrfToken);
      setForm(stateFromItem(saved));
      setNotice(`Visibilité passée en ${statusLabels[status]}.`);
      onSaved(saved);
    } catch (nextError) {
      handleError(nextError);
    } finally {
      setSubmitting(false);
    }
  };

  const archiveContent = async () => {
    if (!initialItem || !window.confirm("Archiver ce contenu ? Il restera disponible dans l'admin mais disparaîtra du site.")) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const archived = await archiveAdminContent(initialItem.id, csrfToken);
      setForm(stateFromItem(archived));
      setNotice("Contenu archivé.");
      onArchived?.(archived);
      onSaved(archived);
    } catch (nextError) {
      handleError(nextError);
    } finally {
      setSubmitting(false);
    }
  };

  const slugHelp = `/creations/${form.slug || "adresse-de-la-page"}`;

  return (
    <form className={`admin-form admin-content-form is-${contentType}`} onSubmit={onSubmit}>
      <div className="admin-form-intro">
        <span>{isMarketplace ? "Ressource marketplace" : "Création portfolio"}</span>
        <h3>{isMarketplace ? "Informations du produit" : "Informations de la création"}</h3>
        <p>{isMarketplace ? "Prépare la fiche marketplace visible sur le site." : "Prépare la fiche portfolio visible sur le site."}</p>
      </div>

      <div className="admin-form-section">
        <div className="admin-form-grid">
          <label className="admin-field" htmlFor="content-title">
            <FieldTitle help="Nom visible sur le portfolio et dans les listes d’administration.">
              Titre affiché
            </FieldTitle>
            <input
              id="content-title"
              value={form.title}
              onChange={(event) => updateTitle(event.target.value)}
              required
            />
          </label>

          {!isMarketplace ? (
            <label className="admin-field" htmlFor="content-slug">
              <FieldTitle
                help={`Adresse courte de la page, elle est générée depuis le titre. Aperçu : ${slugHelp}`}
              >
                Lien de la page
              </FieldTitle>
              <div className="admin-slug-row">
                <input
                  id="content-slug"
                  value={form.slug}
                  onChange={(event) => {
                    setSlugManuallyEdited(true);
                    updateField("slug", event.target.value);
                  }}
                  required
                />
                <button className="admin-inline-action" type="button" onClick={regenerateSlug}>
                  Générer
                </button>
              </div>
            </label>
          ) : null}

          <label className="admin-field" htmlFor="content-status">
            <FieldTitle help="Brouillon masque le contenu, En ligne l’affiche publiquement, Archivé le retire du site.">
              Visibilité
            </FieldTitle>
            <select
              id="content-status"
              value={form.status}
              onChange={(event) => updateField("status", event.target.value as ContentStatus)}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-field" htmlFor="content-published-at">
            <FieldTitle help="Date affichée et utilisée pour trier les contenus. Si elle est vide, la date du jour est utilisée pour le classement interne.">
              Date de publication
            </FieldTitle>
            <input
              id="content-published-at"
              type="datetime-local"
              value={form.publishedAt}
              onChange={(event) => updateField("publishedAt", event.target.value)}
            />
          </label>

          <label className="admin-field admin-field-wide" htmlFor="content-short-description">
            <FieldTitle help="Texte court affiché sur les cartes et les listes publiques.">
              Résumé court
            </FieldTitle>
            <textarea
              id="content-short-description"
              rows={3}
              value={form.shortDescription}
              onChange={(event) => updateField("shortDescription", event.target.value)}
            />
          </label>

          <label className="admin-field admin-field-wide" htmlFor="content-description">
            <FieldTitle help="Texte principal de la fiche. Les données dynamiques restent dans la base et ne sont pas traduites automatiquement.">
              Description complète
            </FieldTitle>
            <textarea
              id="content-description"
              rows={7}
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
            />
          </label>
        </div>
      </div>

      {!isMarketplace ? (
        <div className="admin-form-section">
          <div className="admin-form-section-heading">
            <SectionTitle help="Indique l’origine de la création. Une commission privée ne peut pas être publiée sans accord client.">
              Contexte de création
            </SectionTitle>
          </div>

          <div className="admin-choice-group" role="group" aria-label="Contexte de création">
            {(["personal", "private_commission", "other"] as SourceContext[]).map((sourceContext) => (
              <button
                key={sourceContext}
                className={`admin-choice${form.sourceContext === sourceContext ? " is-selected" : ""}`}
                type="button"
                onClick={() => setSourceContext(sourceContext)}
              >
                {sourceLabels[sourceContext]}
              </button>
            ))}
          </div>

          {form.sourceContext === "private_commission" ? (
            <label className="admin-check-field admin-field-wide" htmlFor="content-client-permission">
              <input
                id="content-client-permission"
                type="checkbox"
                checked={form.clientPermission}
                onChange={(event) => updateField("clientPermission", event.target.checked)}
              />
              Le client a donné son accord pour afficher ce projet publiquement.
            </label>
          ) : null}

          {form.sourceContext === "other" ? (
            <label className="admin-field" htmlFor="content-source-label">
              <FieldTitle help="Nom personnalisé affiché à la place de “Autre”.">
                Nom affiché
              </FieldTitle>
              <input
                id="content-source-label"
                value={form.sourceLabel}
                onChange={(event) => updateField("sourceLabel", event.target.value)}
                placeholder="Autre"
              />
            </label>
          ) : null}

          <label className="admin-field" htmlFor="content-sketchfab-url">
            <FieldTitle help="Lien d’intégration ou page Sketchfab si la création possède une prévisualisation 3D.">
              Lien Sketchfab
            </FieldTitle>
            <input
              id="content-sketchfab-url"
              value={form.sketchfabUrl}
              onChange={(event) => updateField("sketchfabUrl", event.target.value)}
            />
          </label>
        </div>
      ) : (
        <div className="admin-form-section">
          <div className="admin-form-section-heading">
            <SectionTitle help="Renseigne le lien externe, le prix affiché et la plateforme principale du produit.">
              Publication marketplace
            </SectionTitle>
          </div>

          <div className="admin-form-grid">
            <label className="admin-field" htmlFor="content-external-url">
              <FieldTitle help="Adresse de la page de vente ou de téléchargement.">
                Lien externe
              </FieldTitle>
              <input
                id="content-external-url"
                value={form.externalUrl}
                onChange={(event) => updateField("externalUrl", event.target.value)}
              />
            </label>

            <label className="admin-field" htmlFor="content-price-label">
              <FieldTitle help="Texte affiché publiquement pour le prix, par exemple “Gratuit” ou “9,99 €”.">
                Prix affiché
              </FieldTitle>
              <input
                id="content-price-label"
                value={form.priceLabel}
                onChange={(event) => updateField("priceLabel", event.target.value)}
              />
            </label>
          </div>

          <div className="admin-field admin-field-wide">
            <FieldTitle help="Plateforme affichée sur la carte marketplace. Choisis “Autre” pour saisir un nom personnalisé.">
              Plateforme principale
            </FieldTitle>
            <div className="admin-choice-group" role="group" aria-label="Plateforme principale">
              {externalPlatforms.map((platform) => (
                <button
                  key={platform}
                  className={`admin-choice${form.externalPlatform === platform ? " is-selected" : ""}`}
                  type="button"
                  onClick={() => updateField("externalPlatform", platform)}
                >
                  {platformLabels[platform]}
                </button>
              ))}
            </div>
          </div>

          {form.externalPlatform === "other" ? (
            <label className="admin-field" htmlFor="content-platform-label">
              <FieldTitle help="Nom personnalisé affiché pour cette plateforme.">
                Nom de la plateforme
              </FieldTitle>
              <input
                id="content-platform-label"
                value={form.platformLabel}
                onChange={(event) => updateField("platformLabel", event.target.value)}
                placeholder="Autre"
              />
            </label>
          ) : null}
        </div>
      )}

      {initialItem ? <MediaManager contentId={initialItem.id} csrfToken={csrfToken} onUnauthenticated={onUnauthenticated} /> : null}

      <AdminError error={error} />
      {notice ? <p className="admin-status is-visible">{notice}</p> : null}

      <div className="admin-form-actions admin-form-primary-actions">
        <button className="button button-primary" type="submit" disabled={submitting}>
          {submitting ? "Enregistrement..." : "Enregistrer"}
        </button>
        {initialItem && form.status !== "published" ? (
          <button className="button button-secondary" disabled={submitting} type="button" onClick={() => void changeStatus("published")}>
            Mettre en ligne
          </button>
        ) : null}
        {initialItem && form.status !== "draft" ? (
          <button className="button button-secondary" disabled={submitting} type="button" onClick={() => void changeStatus("draft")}>
            Repasser en brouillon
          </button>
        ) : null}
        {initialItem && form.status !== "archived" ? (
          <button className="button button-secondary admin-danger" disabled={submitting} type="button" onClick={archiveContent}>
            Archiver
          </button>
        ) : null}
      </div>
    </form>
  );
}
