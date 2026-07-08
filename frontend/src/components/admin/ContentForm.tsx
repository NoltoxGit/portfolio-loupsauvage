import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import {
  archiveAdminContent,
  createAdminContent,
  previewBuiltByBitResource,
  syncAdminContentBundles,
  updateAdminContent,
  updateAdminContentStatus,
} from "../../api/admin";
import type { AdminContentItem, AdminContentPayload, AdminModelInfo, BuiltByBitPreview } from "../../types/admin";
import type { ContentStatus, ContentType, ExternalPlatform, SourceContext } from "../../types/content";
import { AdminError, isUnauthenticatedError } from "./AdminError";
import { MediaManager } from "./MediaManager";
import { ModelManager, type ModelManagerHandle } from "./ModelManager";
import { CreationBundlesPanel } from "./CreationBundlesPanel";
import { hasSketchfabModel } from "../content/SketchfabEmbed";

const statuses: ContentStatus[] = ["draft", "published", "archived"];
const externalPlatforms: ExternalPlatform[] = ["builtbybit", "mcmodels", "sketchfab", "other"];

const statusLabels: Record<ContentStatus, string> = {
  draft: "Brouillon",
  published: "En ligne",
  archived: "Supprimé",
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
  shortDescription: string;
  status: ContentStatus;
  sourceContext: SourceContext;
  sourceLabel: string;
  clientPermission: boolean;
  sketchfabUrl: string;
  externalUrl: string;
  externalPlatform: ExternalPlatform | "";
  platformLabel: string;
  priceLabel: string;
  builtbybitResourceId: string;
  builtbybitSyncJson: unknown | null;
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
    shortDescription: "",
    status: "draft",
    sourceContext: contentType === "marketplace" ? "marketplace_product" : "personal",
    sourceLabel: "",
    clientPermission: false,
    sketchfabUrl: "",
    externalUrl: "",
    externalPlatform: contentType === "marketplace" ? "other" : "",
    platformLabel: "",
    priceLabel: "",
    builtbybitResourceId: "",
    builtbybitSyncJson: null,
    publishedAt: nowInputDateTime(),
    displayDate: currentDate,
  };
}

function stateFromItem(item: AdminContentItem): ContentFormState {
  return {
    title: item.title,
    shortDescription: item.shortDescription ?? "",
    status: item.status,
    sourceContext: item.sourceContext,
    sourceLabel: item.sourceLabel ?? "",
    clientPermission: item.clientPermission,
    sketchfabUrl: item.sketchfabUrl ?? "",
    externalUrl: item.externalUrl ?? "",
    externalPlatform: item.type === "marketplace" ? item.externalPlatform ?? "other" : item.externalPlatform ?? "",
    platformLabel: item.platformLabel ?? "",
    priceLabel: item.priceLabel ?? "",
    builtbybitResourceId: item.builtbybitResourceId ?? "",
    builtbybitSyncJson: item.builtbybitSyncJson ?? null,
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

function MediaSetupNotice({ contentType }: { contentType: ContentType }) {
  return (
    <section className="admin-media-manager admin-attachment-setup">
      <div className="admin-media-heading">
        <div>
          <span>{contentType === "creation" ? "Images de la création" : "Images du produit"}</span>
          <h3>Médias disponibles après création</h3>
          <p>
            Enregistre la fiche pour créer son identifiant. Tu pourras ensuite ajouter les images d’illustration directement
            sur cette page.
          </p>
        </div>
      </div>
    </section>
  );
}

function mergeModelInfo(item: AdminContentItem, model: AdminModelInfo): AdminContentItem {
  return {
    ...item,
    modelGlbPath: model.modelGlbPath,
    modelPreviewImagePath: model.modelPreviewImagePath,
    modelWatermarkEnabled: model.modelWatermarkEnabled,
    modelViewerYawDegrees: model.modelViewerYawDegrees,
  };
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
  const modelManagerRef = useRef<ModelManagerHandle | null>(null);
  const [form, setForm] = useState<ContentFormState>(() =>
    initialItem ? stateFromItem(initialItem) : defaultState(contentType),
  );
  const selectableStatuses = form.status === "archived" ? statuses : statuses.filter((status) => status !== "archived");
  const [selectedBundleIds, setSelectedBundleIds] = useState<number[]>(() =>
    initialItem?.bundles?.map((bundle) => bundle.id) ?? [],
  );
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mediaCount, setMediaCount] = useState(() => initialItem?.media.length ?? 0);
  const [hasModel, setHasModel] = useState(() => Boolean(initialItem?.modelGlbPath));
  const [hasPendingModel, setHasPendingModel] = useState(false);
  const [builtByBitInput, setBuiltByBitInput] = useState("");
  const [builtByBitPreview, setBuiltByBitPreview] = useState<BuiltByBitPreview | null>(null);
  const [builtByBitLoading, setBuiltByBitLoading] = useState(false);

  useEffect(() => {
    setForm(initialItem ? stateFromItem(initialItem) : defaultState(contentType));
    setSelectedBundleIds(initialItem?.bundles?.map((bundle) => bundle.id) ?? []);
    setError(null);
    setNotice(null);
    setMediaCount(initialItem?.media.length ?? 0);
    setHasModel(Boolean(initialItem?.modelGlbPath));
    setHasPendingModel(false);
    setBuiltByBitInput("");
    setBuiltByBitPreview(null);
  }, [contentType, initialItem]);

  const updateField = <K extends keyof ContentFormState>(key: K, value: ContentFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateTitle = (title: string) => {
    setForm((current) => ({
      ...current,
      title,
    }));
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
      shortDescription: trimOrNull(form.shortDescription),
      status: form.status,
      sourceContext,
      sourceLabel: !isMarketplace && sourceContext === "other" ? trimOrNull(form.sourceLabel) : null,
      clientPermission: !isMarketplace && sourceContext === "private_commission" ? form.clientPermission : false,
      sketchfabUrl: isMarketplace ? null : trimOrNull(form.sketchfabUrl),
      externalUrl: trimOrNull(form.externalUrl),
      externalPlatform: form.externalPlatform === "" ? null : form.externalPlatform,
      platformLabel: isMarketplace && form.externalPlatform === "other" ? trimOrNull(form.platformLabel) : null,
      priceLabel: trimOrNull(form.priceLabel),
      builtbybitResourceId: isMarketplace ? trimOrNull(form.builtbybitResourceId) : null,
      builtbybitSyncJson: isMarketplace ? form.builtbybitSyncJson : null,
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

  const canPublishCreation = (status: ContentStatus) => {
    if (isMarketplace || status !== "published") {
      return true;
    }

    return hasSketchfabModel(form.sketchfabUrl) || mediaCount > 0 || hasModel || hasPendingModel;
  };

  const guardPublishCreation = (status: ContentStatus) => {
    if (canPublishCreation(status)) {
      return true;
    }

    setError(null);
    setNotice("Ajoutez au moins une image, un lien Sketchfab ou un modèle GLB pour publier cette création.");
    return false;
  };

  const previewBuiltByBit = async () => {
    const input = builtByBitInput.trim();

    if (!input) {
      setError(null);
      setNotice("Colle une URL BuiltByBit ou un ID de ressource.");
      return;
    }

    setBuiltByBitLoading(true);
    setError(null);
    setNotice(null);

    try {
      setBuiltByBitPreview(await previewBuiltByBitResource({ input }, csrfToken));
      setNotice("Import BuiltByBit prêt à vérifier.");
    } catch (nextError) {
      handleError(nextError);
    } finally {
      setBuiltByBitLoading(false);
    }
  };

  const applyBuiltByBitPreview = () => {
    if (!builtByBitPreview) {
      return;
    }

    const replacements = [
      form.title,
      form.shortDescription,
      form.externalUrl,
      form.priceLabel,
      form.builtbybitResourceId,
    ].some((value) => value.trim() !== "");

    if (replacements && !window.confirm("Utiliser ces informations BuiltByBit et remplacer les champs déjà remplis ?")) {
      return;
    }

    setForm((current) => ({
      ...current,
      title: builtByBitPreview.title || current.title,
      shortDescription: builtByBitPreview.summary || current.shortDescription,
      externalUrl: builtByBitPreview.externalUrl || current.externalUrl,
      externalPlatform: "builtbybit",
      platformLabel: "",
      priceLabel: builtByBitPreview.priceLabel || current.priceLabel,
      builtbybitResourceId: builtByBitPreview.resourceId,
      builtbybitSyncJson: builtByBitPreview.rawSyncJson,
    }));
    setNotice("Informations BuiltByBit appliquées. Enregistre pour les conserver.");
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);

    if (!guardPublishCreation(form.status)) {
      setSubmitting(false);
      return;
    }

    try {
      const payload = toPayload();
      const needsDeferredPublish =
        contentType === "creation" &&
        payload.status === "published" &&
        hasPendingModel &&
        !hasSketchfabModel(form.sketchfabUrl) &&
        mediaCount === 0 &&
        !hasModel;
      const payloadToSave: AdminContentPayload = needsDeferredPublish ? { ...payload, status: "draft" } : payload;
      const saved =
        initialItem && isEdit
          ? await updateAdminContent(initialItem.id, payloadToSave, csrfToken)
          : await createAdminContent(payloadToSave, csrfToken);
      const uploadedModel = await modelManagerRef.current?.uploadPendingModel(saved);
      let finalSaved = uploadedModel ? mergeModelInfo(saved, uploadedModel) : saved;

      if (contentType === "creation") {
        const synced = await syncAdminContentBundles(saved.id, { bundleIds: selectedBundleIds }, csrfToken);
        finalSaved = { ...finalSaved, bundles: synced.bundles };
      }

      if (needsDeferredPublish) {
        finalSaved = await updateAdminContentStatus(saved.id, { status: "published" }, csrfToken);
      }

      setForm(stateFromItem(finalSaved));
      setMediaCount(finalSaved.media.length);
      setHasModel(Boolean(finalSaved.modelGlbPath));
      setNotice(uploadedModel ? "Contenu enregistré avec le modèle GLB." : "Contenu enregistré.");
      onSaved(finalSaved);
    } catch (nextError) {
      handleError(nextError);
    } finally {
      setSubmitting(false);
    }
  };

  const changeStatus = async (status: ContentStatus) => {
    if (!initialItem) {
      if (!guardPublishCreation(status)) {
        return;
      }

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
      if (!guardPublishCreation(status)) {
        return;
      }

      const saved = await updateAdminContentStatus(initialItem.id, { status }, csrfToken);
      setForm(stateFromItem(saved));
      setMediaCount(saved.media.length);
      setNotice(`Visibilité passée en ${statusLabels[status]}.`);
      onSaved(saved);
    } catch (nextError) {
      handleError(nextError);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteContent = async () => {
    if (!initialItem || !window.confirm("Supprimer ce contenu ? Il disparaîtra du site et des listes actives.")) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const archived = await archiveAdminContent(initialItem.id, csrfToken);
      setForm(stateFromItem(archived));
      setNotice("Contenu supprimé.");
      onArchived?.(archived);
      onSaved(archived);
    } catch (nextError) {
      handleError(nextError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <form className={`admin-form admin-content-form is-${contentType}`} onSubmit={onSubmit}>
      <div className="admin-form-intro">
        <span>{isMarketplace ? "Ressource marketplace" : "Création portfolio"}</span>
        <h3>{isMarketplace ? "Informations du produit" : "Informations de la création"}</h3>
        <p>{isMarketplace ? "Prépare la fiche marketplace visible sur le site." : "Prépare la fiche portfolio visible sur le site."}</p>
      </div>

      <div className="admin-form-section admin-section-main">
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

          <label className="admin-field" htmlFor="content-status">
            <FieldTitle help="Brouillon masque le contenu. En ligne l’affiche publiquement. La suppression se fait avec le bouton dédié.">
              Visibilité
            </FieldTitle>
            <select
              id="content-status"
              value={form.status}
              onChange={(event) => updateField("status", event.target.value as ContentStatus)}
            >
              {selectableStatuses.map((status) => (
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

        </div>
      </div>

      {!isMarketplace ? (
        <div className="admin-form-section admin-section-creation">
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
            <FieldTitle help="Lien optionnel si tu veux conserver une preview externe en complément du modèle GLB et des images.">
              Lien Sketchfab optionnel
            </FieldTitle>
            <input
              id="content-sketchfab-url"
              value={form.sketchfabUrl}
              onChange={(event) => updateField("sketchfabUrl", event.target.value)}
            />
          </label>
        </div>
      ) : (
        <div className="admin-form-section admin-section-marketplace">
          <div className="admin-form-section-heading">
            <SectionTitle help="Renseigne le lien externe, le prix affiché et la plateforme principale du produit.">
              Publication marketplace
            </SectionTitle>
          </div>

          <div className="admin-import-panel">
            <div className="admin-import-copy">
              <span>Importer depuis BuiltByBit</span>
              <p>Colle une URL ou un ID de ressource pour préremplir la fiche sans exposer le token côté navigateur.</p>
            </div>
            <div className="admin-import-row">
              <label className="admin-field" htmlFor="builtbybit-import-input">
                <span>URL ou ID</span>
                <input
                  id="builtbybit-import-input"
                  value={builtByBitInput}
                  onChange={(event) => setBuiltByBitInput(event.target.value)}
                  placeholder="https://builtbybit.com/resources/..."
                />
              </label>
              <button className="button button-secondary" type="button" disabled={builtByBitLoading} onClick={() => void previewBuiltByBit()}>
                {builtByBitLoading ? "Prévisualisation..." : "Prévisualiser l’import"}
              </button>
            </div>

            {builtByBitPreview ? (
              <div className="admin-import-preview">
                {builtByBitPreview.coverImageUrl ? <img src={builtByBitPreview.coverImageUrl} alt="" loading="lazy" /> : null}
                <div>
                  <span>Ressource #{builtByBitPreview.resourceId}</span>
                  <h4>{builtByBitPreview.title}</h4>
                  <p>{builtByBitPreview.summary || builtByBitPreview.descriptionBbcode || "Aucun résumé fourni."}</p>
                  <dl>
                    <div>
                      <dt>Prix</dt>
                      <dd>{builtByBitPreview.priceLabel || "Non renseigné"}</dd>
                    </div>
                    <div>
                      <dt>Lien</dt>
                      <dd>{builtByBitPreview.externalUrl}</dd>
                    </div>
                    <div>
                      <dt>Images</dt>
                      <dd>{[builtByBitPreview.coverImageUrl, ...builtByBitPreview.carouselImageUrls].filter(Boolean).length}</dd>
                    </div>
                  </dl>
                  <button className="button button-primary" type="button" onClick={applyBuiltByBitPreview}>
                    Utiliser ces informations
                  </button>
                </div>
              </div>
            ) : null}
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

      {!isMarketplace ? (
        <CreationBundlesPanel
          contentId={initialItem?.id}
          selectedIds={selectedBundleIds}
          onSelectedIdsChange={setSelectedBundleIds}
          csrfToken={csrfToken}
          onUnauthenticated={onUnauthenticated}
        />
      ) : null}

      <ModelManager
        ref={modelManagerRef}
        item={initialItem ?? null}
        csrfToken={csrfToken}
        onPendingModelChange={setHasPendingModel}
        onModelChanged={(model) => setHasModel(Boolean(model.modelGlbPath))}
        onUnauthenticated={onUnauthenticated}
      />

      <AdminError error={error} />
      {notice ? <p className="admin-status is-visible">{notice}</p> : null}

      <div className="admin-form-actions admin-form-primary-actions">
        <button className="button button-primary" type="submit" disabled={submitting}>
          {submitting ? "Enregistrement..." : initialItem ? "Enregistrer" : hasPendingModel ? "Créer avec le modèle" : "Créer"}
        </button>
        {initialItem && form.status === "draft" ? (
          <button className="button button-secondary" disabled={submitting} type="button" onClick={() => void changeStatus("published")}>
            Publier
          </button>
        ) : null}
        {initialItem && form.status === "published" ? (
          <button className="button button-secondary" disabled={submitting} type="button" onClick={() => void changeStatus("draft")}>
            Masquer
          </button>
        ) : null}
        {initialItem && form.status !== "archived" ? (
          <button className="button button-secondary admin-danger" disabled={submitting} type="button" onClick={deleteContent}>
            Supprimer
          </button>
        ) : null}
      </div>
    </form>
      {initialItem ? (
        <>
          <MediaManager
            contentId={initialItem.id}
            csrfToken={csrfToken}
            onMediaChanged={(items) => setMediaCount(items.length)}
            onUnauthenticated={onUnauthenticated}
          />
        </>
      ) : (
        <MediaSetupNotice contentType={contentType} />
      )}
    </>
  );
}
