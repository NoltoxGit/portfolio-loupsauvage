import { FormEvent, useEffect, useState } from "react";
import {
  archiveAdminContent,
  createAdminContent,
  updateAdminContent,
  updateAdminContentStatus,
} from "../../api/admin";
import type { AdminContentItem, AdminContentPayload } from "../../types/admin";
import type { ContentStatus, ContentType, ExternalPlatform, SourceContext } from "../../types/content";
import { AdminError, isUnauthenticatedError } from "./AdminError";

const statuses: ContentStatus[] = ["draft", "published", "archived"];
const sourceContexts: SourceContext[] = ["personal", "private_commission", "marketplace_product", "other"];
const externalPlatforms: ExternalPlatform[] = ["builtbybit", "mcmodels", "sketchfab", "other"];

interface ContentFormState {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  status: ContentStatus;
  sourceContext: SourceContext;
  clientPermission: boolean;
  sketchfabUrl: string;
  externalUrl: string;
  externalPlatform: ExternalPlatform | "";
  priceLabel: string;
  sortOrder: string;
  publishedAt: string;
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

function defaultState(contentType: ContentType): ContentFormState {
  return {
    title: "",
    slug: "",
    shortDescription: "",
    description: "",
    status: "draft",
    sourceContext: contentType === "marketplace" ? "marketplace_product" : "personal",
    clientPermission: false,
    sketchfabUrl: "",
    externalUrl: "",
    externalPlatform: "",
    priceLabel: "",
    sortOrder: "0",
    publishedAt: "",
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
    clientPermission: item.clientPermission,
    sketchfabUrl: item.sketchfabUrl ?? "",
    externalUrl: item.externalUrl ?? "",
    externalPlatform: item.externalPlatform ?? "",
    priceLabel: item.priceLabel ?? "",
    sortOrder: String(item.sortOrder),
    publishedAt: toInputDateTime(item.publishedAt),
  };
}

function trimOrNull(value: string) {
  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
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
  const [form, setForm] = useState<ContentFormState>(() =>
    initialItem ? stateFromItem(initialItem) : defaultState(contentType),
  );
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(initialItem ? stateFromItem(initialItem) : defaultState(contentType));
    setError(null);
    setNotice(null);
  }, [contentType, initialItem]);

  const updateField = <K extends keyof ContentFormState>(key: K, value: ContentFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toPayload = (): AdminContentPayload => ({
    type: contentType,
    title: form.title,
    slug: form.slug,
    shortDescription: trimOrNull(form.shortDescription),
    description: trimOrNull(form.description),
    status: form.status,
    sourceContext: form.sourceContext,
    clientPermission: form.clientPermission,
    sketchfabUrl: trimOrNull(form.sketchfabUrl),
    externalUrl: trimOrNull(form.externalUrl),
    externalPlatform: form.externalPlatform === "" ? null : form.externalPlatform,
    priceLabel: trimOrNull(form.priceLabel),
    sortOrder: Number.parseInt(form.sortOrder, 10) || 0,
    publishedAt: fromInputDateTime(form.publishedAt),
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
      const saved =
        initialItem && isEdit
          ? await updateAdminContent(initialItem.id, toPayload(), csrfToken)
          : await createAdminContent(toPayload(), csrfToken);

      setForm(stateFromItem(saved));
      setNotice("Contenu enregistre.");
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

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const saved = await updateAdminContentStatus(initialItem.id, { status }, csrfToken);
      setForm(stateFromItem(saved));
      setNotice(`Statut passe en ${status}.`);
      onSaved(saved);
    } catch (nextError) {
      handleError(nextError);
    } finally {
      setSubmitting(false);
    }
  };

  const archiveContent = async () => {
    if (!initialItem) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const archived = await archiveAdminContent(initialItem.id, csrfToken);
      setForm(stateFromItem(archived));
      setNotice("Contenu archive.");
      onArchived?.(archived);
      onSaved(archived);
    } catch (nextError) {
      handleError(nextError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <div className="admin-form-grid">
        <label className="admin-field" htmlFor="content-title">
          <span>Titre</span>
          <input
            id="content-title"
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
            required
          />
        </label>

        <label className="admin-field" htmlFor="content-slug">
          <span>Slug</span>
          <input
            id="content-slug"
            value={form.slug}
            onChange={(event) => updateField("slug", event.target.value)}
            required
          />
        </label>

        <label className="admin-field" htmlFor="content-status">
          <span>Status</span>
          <select
            id="content-status"
            value={form.status}
            onChange={(event) => updateField("status", event.target.value as ContentStatus)}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-field" htmlFor="content-source-context">
          <span>Source</span>
          <select
            id="content-source-context"
            value={form.sourceContext}
            onChange={(event) => updateField("sourceContext", event.target.value as SourceContext)}
          >
            {sourceContexts.map((sourceContext) => (
              <option key={sourceContext} value={sourceContext}>
                {sourceContext}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-field admin-field-wide" htmlFor="content-short-description">
          <span>Description courte</span>
          <textarea
            id="content-short-description"
            rows={3}
            value={form.shortDescription}
            onChange={(event) => updateField("shortDescription", event.target.value)}
          />
        </label>

        <label className="admin-field admin-field-wide" htmlFor="content-description">
          <span>Description</span>
          <textarea
            id="content-description"
            rows={7}
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
          />
        </label>

        <label className="admin-field" htmlFor="content-sketchfab-url">
          <span>Sketchfab URL</span>
          <input
            id="content-sketchfab-url"
            value={form.sketchfabUrl}
            onChange={(event) => updateField("sketchfabUrl", event.target.value)}
          />
        </label>

        <label className="admin-field" htmlFor="content-external-url">
          <span>External URL</span>
          <input
            id="content-external-url"
            value={form.externalUrl}
            onChange={(event) => updateField("externalUrl", event.target.value)}
          />
        </label>

        <label className="admin-field" htmlFor="content-external-platform">
          <span>External platform</span>
          <select
            id="content-external-platform"
            value={form.externalPlatform}
            onChange={(event) => updateField("externalPlatform", event.target.value as ExternalPlatform | "")}
          >
            <option value="">Aucune</option>
            {externalPlatforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-field" htmlFor="content-price-label">
          <span>Price label</span>
          <input
            id="content-price-label"
            value={form.priceLabel}
            onChange={(event) => updateField("priceLabel", event.target.value)}
          />
        </label>

        <label className="admin-field" htmlFor="content-sort-order">
          <span>Sort order</span>
          <input
            id="content-sort-order"
            type="number"
            value={form.sortOrder}
            onChange={(event) => updateField("sortOrder", event.target.value)}
          />
        </label>

        <label className="admin-field" htmlFor="content-published-at">
          <span>Published at</span>
          <input
            id="content-published-at"
            type="datetime-local"
            value={form.publishedAt}
            onChange={(event) => updateField("publishedAt", event.target.value)}
          />
        </label>

        <label className="admin-check-field admin-field-wide" htmlFor="content-client-permission">
          <input
            id="content-client-permission"
            type="checkbox"
            checked={form.clientPermission}
            onChange={(event) => updateField("clientPermission", event.target.checked)}
          />
          Accord client pour publication
        </label>
      </div>

      {initialItem?.media.length ? (
        <div className="admin-readonly-media">
          <span>Medias existants en lecture seule</span>
          <div className="admin-gallery-preview">
            {initialItem.media.map((media) => (
              <a className="admin-gallery-thumb" key={media.id} href={media.path} target="_blank" rel="noreferrer">
                <img src={media.path} alt={media.alt ?? initialItem.title} />
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <AdminError error={error} />
      {notice ? <p className="admin-status is-visible">{notice}</p> : null}

      <div className="admin-form-actions">
        <button className="button button-primary" type="submit" disabled={submitting}>
          {submitting ? "Enregistrement..." : "Enregistrer"}
        </button>
        {statuses.map((status) => (
          <button
            className="button button-secondary"
            disabled={submitting || form.status === status}
            key={status}
            type="button"
            onClick={() => void changeStatus(status)}
          >
            {status}
          </button>
        ))}
        {initialItem ? (
          <button className="button button-secondary admin-danger" disabled={submitting} type="button" onClick={archiveContent}>
            Archiver
          </button>
        ) : null}
      </div>
    </form>
  );
}
