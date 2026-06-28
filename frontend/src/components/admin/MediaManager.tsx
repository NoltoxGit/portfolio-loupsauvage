import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { deleteAdminMedia, listAdminMedia, updateAdminMedia, uploadAdminMedia } from "../../api/admin";
import type { AdminMediaItem, AdminMediaKind } from "../../types/admin";
import { AdminError, isUnauthenticatedError } from "./AdminError";

const mediaKinds: AdminMediaKind[] = ["cover", "gallery", "render", "thumbnail"];

const mediaKindLabels: Record<AdminMediaKind, string> = {
  cover: "Image principale",
  gallery: "Galerie",
  render: "Rendu",
  thumbnail: "Aperçu",
};

interface MediaFormState {
  kind: AdminMediaKind;
  alt: string;
  sortOrder: string;
}

interface UploadFormState extends MediaFormState {
  file: File | null;
}

const defaultUploadForm: UploadFormState = {
  kind: "gallery",
  alt: "",
  sortOrder: "0",
  file: null,
};

function stateFromMedia(media: AdminMediaItem): MediaFormState {
  return {
    kind: media.kind,
    alt: media.alt ?? "",
    sortOrder: String(media.sortOrder),
  };
}

function toNullableString(value: string) {
  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
}

function toInteger(value: string) {
  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) ? parsed : 0;
}

function MediaKindChoices({
  value,
  onChange,
  disabled = false,
}: {
  value: AdminMediaKind;
  onChange: (kind: AdminMediaKind) => void;
  disabled?: boolean;
}) {
  return (
    <div className="admin-choice-group admin-media-kind-group" role="group" aria-label="Rôle de l’image">
      {mediaKinds.map((kind) => (
        <button
          className={`admin-choice${value === kind ? " is-selected" : ""}`}
          disabled={disabled}
          key={kind}
          type="button"
          onClick={() => onChange(kind)}
        >
          {mediaKindLabels[kind]}
        </button>
      ))}
    </div>
  );
}

export function MediaManager({
  contentId,
  csrfToken,
  onUnauthenticated,
}: {
  contentId: number;
  csrfToken: string;
  onUnauthenticated: () => void;
}) {
  const [mediaItems, setMediaItems] = useState<AdminMediaItem[]>([]);
  const [editForms, setEditForms] = useState<Record<number, MediaFormState>>({});
  const [uploadForm, setUploadForm] = useState<UploadFormState>(defaultUploadForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busyMediaId, setBusyMediaId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleError = useCallback(
    (nextError: unknown) => {
      if (isUnauthenticatedError(nextError)) {
        onUnauthenticated();
        return;
      }

      setError(nextError);
    },
    [onUnauthenticated],
  );

  const loadMedia = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const items = await listAdminMedia(contentId);
      const forms = items.reduce<Record<number, MediaFormState>>((nextForms, item) => {
        nextForms[item.id] = stateFromMedia(item);
        return nextForms;
      }, {});

      setMediaItems(items);
      setEditForms(forms);
    } catch (nextError) {
      handleError(nextError);
    } finally {
      setLoading(false);
    }
  }, [contentId, handleError]);

  useEffect(() => {
    void loadMedia();
  }, [loadMedia]);

  const updateUploadField = <K extends keyof UploadFormState>(key: K, value: UploadFormState[K]) => {
    setUploadForm((current) => ({ ...current, [key]: value }));
  };

  const updateEditField = <K extends keyof MediaFormState>(id: number, key: K, value: MediaFormState[K]) => {
    setEditForms((current) => ({
      ...current,
      [id]: {
        ...(current[id] ?? { kind: "gallery", alt: "", sortOrder: "0" }),
        [key]: value,
      },
    }));
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateUploadField("file", event.target.files?.[0] ?? null);
  };

  const uploadMedia = async () => {
    if (!uploadForm.file) {
      setError(null);
      setNotice("Choisis une image avant l’envoi.");
      return;
    }

    setUploading(true);
    setError(null);
    setNotice(null);

    try {
      await uploadAdminMedia(
        {
          contentItemId: contentId,
          kind: uploadForm.kind,
          alt: toNullableString(uploadForm.alt),
          sortOrder: toInteger(uploadForm.sortOrder),
          file: uploadForm.file,
        },
        csrfToken,
      );

      setUploadForm(defaultUploadForm);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setNotice("Image ajoutée.");
      await loadMedia();
    } catch (nextError) {
      handleError(nextError);
    } finally {
      setUploading(false);
    }
  };

  const saveMedia = async (mediaId: number) => {
    const form = editForms[mediaId];

    if (!form) {
      return;
    }

    setBusyMediaId(mediaId);
    setError(null);
    setNotice(null);

    try {
      await updateAdminMedia(
        mediaId,
        {
          kind: form.kind,
          alt: toNullableString(form.alt),
          sortOrder: toInteger(form.sortOrder),
        },
        csrfToken,
      );

      setNotice("Image mise à jour.");
      await loadMedia();
    } catch (nextError) {
      handleError(nextError);
    } finally {
      setBusyMediaId(null);
    }
  };

  const removeMedia = async (mediaId: number) => {
    if (!window.confirm("Supprimer cette image ? Le fichier sera aussi supprimé si l’API peut le faire en sécurité.")) {
      return;
    }

    setBusyMediaId(mediaId);
    setError(null);
    setNotice(null);

    try {
      await deleteAdminMedia(mediaId, csrfToken);
      setNotice("Image supprimée.");
      await loadMedia();
    } catch (nextError) {
      handleError(nextError);
    } finally {
      setBusyMediaId(null);
    }
  };

  return (
    <section className="admin-media-manager" aria-labelledby="admin-media-title">
      <div className="admin-media-heading">
        <div>
          <span>Images</span>
          <h3 id="admin-media-title">Images du contenu</h3>
          <p>Ajoute une image principale et des images de galerie. Les aperçus ne sont pas rognés.</p>
        </div>
        <button className="button button-secondary" type="button" onClick={() => void loadMedia()} disabled={loading}>
          Actualiser
        </button>
      </div>

      <div className="admin-media-upload">
        <label className="admin-field admin-field-wide" htmlFor="media-upload-file">
          <span>Nouvelle image</span>
          <input
            id="media-upload-file"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={onFileChange}
          />
        </label>

        <div className="admin-field admin-field-wide">
          <span>Rôle de l’image</span>
          <MediaKindChoices value={uploadForm.kind} onChange={(kind) => updateUploadField("kind", kind)} disabled={uploading} />
        </div>

        <label className="admin-field" htmlFor="media-upload-alt">
          <span>Texte d’accessibilité</span>
          <input
            id="media-upload-alt"
            value={uploadForm.alt}
            onChange={(event) => updateUploadField("alt", event.target.value)}
            placeholder="Facultatif"
          />
        </label>

        <label className="admin-field" htmlFor="media-upload-sort-order">
          <span>Position d’affichage</span>
          <input
            id="media-upload-sort-order"
            type="number"
            value={uploadForm.sortOrder}
            onChange={(event) => updateUploadField("sortOrder", event.target.value)}
          />
        </label>

        <div className="admin-media-actions">
          <button className="button button-primary" type="button" disabled={uploading} onClick={() => void uploadMedia()}>
            {uploading ? "Envoi..." : "Ajouter l’image"}
          </button>
        </div>
      </div>

      <AdminError error={error} />
      {notice ? <p className="admin-status is-visible">{notice}</p> : null}

      {loading ? <p className="admin-media-empty">Chargement des images...</p> : null}

      {!loading && mediaItems.length === 0 ? <p className="admin-media-empty">Aucune image pour ce contenu.</p> : null}

      {!loading && mediaItems.length > 0 ? (
        <div className="admin-media-list">
          {mediaItems.map((media) => {
            const form = editForms[media.id] ?? stateFromMedia(media);
            const isBusy = busyMediaId === media.id;

            return (
              <article className="admin-media-card" key={media.id}>
                <a className="admin-media-preview" href={media.path} target="_blank" rel="noreferrer">
                  <img src={media.path} alt={media.alt ?? "Image du contenu"} loading="lazy" />
                </a>

                <div className="admin-media-fields">
                  <div className="admin-field admin-field-wide">
                    <span>Rôle de l’image</span>
                    <MediaKindChoices
                      value={form.kind}
                      onChange={(kind) => updateEditField(media.id, "kind", kind)}
                      disabled={isBusy}
                    />
                  </div>

                  <label className="admin-field" htmlFor={`media-alt-${media.id}`}>
                    <span>Texte d’accessibilité</span>
                    <input
                      id={`media-alt-${media.id}`}
                      value={form.alt}
                      onChange={(event) => updateEditField(media.id, "alt", event.target.value)}
                      placeholder="Facultatif"
                    />
                  </label>

                  <label className="admin-field" htmlFor={`media-sort-order-${media.id}`}>
                    <span>Position d’affichage</span>
                    <input
                      id={`media-sort-order-${media.id}`}
                      type="number"
                      value={form.sortOrder}
                      onChange={(event) => updateEditField(media.id, "sortOrder", event.target.value)}
                    />
                  </label>

                  <p className="admin-media-path">{media.path}</p>
                </div>

                <div className="admin-media-actions">
                  <button className="button button-secondary" type="button" disabled={isBusy} onClick={() => void saveMedia(media.id)}>
                    Enregistrer
                  </button>
                  <button className="button button-secondary admin-danger" type="button" disabled={isBusy} onClick={() => void removeMedia(media.id)}>
                    Supprimer
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
