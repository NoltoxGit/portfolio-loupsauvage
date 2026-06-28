import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { deleteAdminMedia, listAdminMedia, updateAdminMedia, uploadAdminMedia } from "../../api/admin";
import type { AdminMediaItem, AdminMediaKind } from "../../types/admin";
import { AdminError, isUnauthenticatedError } from "./AdminError";

const mediaKinds: AdminMediaKind[] = ["cover", "gallery", "render", "thumbnail"];

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
      setNotice("Choisis un fichier avant l’envoi.");
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
      setNotice("Média ajouté.");
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

      setNotice("Média mis à jour.");
      await loadMedia();
    } catch (nextError) {
      handleError(nextError);
    } finally {
      setBusyMediaId(null);
    }
  };

  const removeMedia = async (mediaId: number) => {
    if (!window.confirm("Supprimer ce média ?")) {
      return;
    }

    setBusyMediaId(mediaId);
    setError(null);
    setNotice(null);

    try {
      await deleteAdminMedia(mediaId, csrfToken);
      setNotice("Média supprimé.");
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
          <span>Médias</span>
          <h3 id="admin-media-title">Médias du contenu</h3>
        </div>
        <button className="button button-secondary" type="button" onClick={() => void loadMedia()} disabled={loading}>
          Actualiser
        </button>
      </div>

      <div className="admin-media-upload">
        <label className="admin-field" htmlFor="media-upload-file">
          <span>Fichier</span>
          <input
            id="media-upload-file"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={onFileChange}
          />
        </label>

        <label className="admin-field" htmlFor="media-upload-kind">
          <span>Type</span>
          <select
            id="media-upload-kind"
            value={uploadForm.kind}
            onChange={(event) => updateUploadField("kind", event.target.value as AdminMediaKind)}
          >
            {mediaKinds.map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-field" htmlFor="media-upload-alt">
          <span>Alt</span>
          <input id="media-upload-alt" value={uploadForm.alt} onChange={(event) => updateUploadField("alt", event.target.value)} />
        </label>

        <label className="admin-field" htmlFor="media-upload-sort-order">
          <span>Ordre</span>
          <input
            id="media-upload-sort-order"
            type="number"
            value={uploadForm.sortOrder}
            onChange={(event) => updateUploadField("sortOrder", event.target.value)}
          />
        </label>

        <div className="admin-media-actions">
          <button className="button button-primary" type="button" disabled={uploading} onClick={() => void uploadMedia()}>
            {uploading ? "Envoi..." : "Ajouter un média"}
          </button>
        </div>
      </div>

      <AdminError error={error} />
      {notice ? <p className="admin-status is-visible">{notice}</p> : null}

      {loading ? <p className="admin-media-empty">Chargement des médias...</p> : null}

      {!loading && mediaItems.length === 0 ? <p className="admin-media-empty">Aucun média pour ce contenu.</p> : null}

      {!loading && mediaItems.length > 0 ? (
        <div className="admin-media-list">
          {mediaItems.map((media) => {
            const form = editForms[media.id] ?? stateFromMedia(media);
            const isBusy = busyMediaId === media.id;

            return (
              <article className="admin-media-card" key={media.id}>
                <a className="admin-media-preview" href={media.path} target="_blank" rel="noreferrer">
                  <img src={media.path} alt={media.alt ?? "Média"} loading="lazy" />
                </a>

                <div className="admin-media-fields">
                  <label className="admin-field" htmlFor={`media-kind-${media.id}`}>
                    <span>Type</span>
                    <select
                      id={`media-kind-${media.id}`}
                      value={form.kind}
                      onChange={(event) => updateEditField(media.id, "kind", event.target.value as AdminMediaKind)}
                    >
                      {mediaKinds.map((kind) => (
                        <option key={kind} value={kind}>
                          {kind}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="admin-field" htmlFor={`media-alt-${media.id}`}>
                    <span>Alt</span>
                    <input id={`media-alt-${media.id}`} value={form.alt} onChange={(event) => updateEditField(media.id, "alt", event.target.value)} />
                  </label>

                  <label className="admin-field" htmlFor={`media-sort-order-${media.id}`}>
                    <span>Ordre</span>
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
