import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { deleteAdminMedia, listAdminMedia, updateAdminMedia, uploadAdminMedia } from "../../api/admin";
import type { AdminMediaItem } from "../../types/admin";
import { mediaBackgroundStyle } from "../content/media";
import { AdminError, isUnauthenticatedError } from "./AdminError";

interface MediaFormState {
  alt: string;
}

interface UploadFormState extends MediaFormState {
  file: File | null;
}

const defaultUploadForm: UploadFormState = {
  alt: "",
  file: null,
};

function stateFromMedia(media: AdminMediaItem): MediaFormState {
  return {
    alt: media.alt ?? "",
  };
}

function toNullableString(value: string) {
  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
}

export function MediaManager({
  contentId,
  csrfToken,
  onMediaChanged,
  onUnauthenticated,
}: {
  contentId: number;
  csrfToken: string;
  onMediaChanged?: (items: AdminMediaItem[]) => void;
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
      onMediaChanged?.(items);
    } catch (nextError) {
      handleError(nextError);
    } finally {
      setLoading(false);
    }
  }, [contentId, handleError, onMediaChanged]);

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
        ...(current[id] ?? { alt: "" }),
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
          kind: "gallery",
          alt: toNullableString(uploadForm.alt),
          sortOrder: mediaItems.length * 10,
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

  const saveMedia = async (media: AdminMediaItem) => {
    const form = editForms[media.id];

    if (!form) {
      return;
    }

    setBusyMediaId(media.id);
    setError(null);
    setNotice(null);

    try {
      await updateAdminMedia(
        media.id,
        {
          kind: media.kind,
          alt: toNullableString(form.alt),
          sortOrder: media.sortOrder,
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
    <section className="admin-media-manager admin-carousel-manager" aria-labelledby="admin-media-title">
      <div className="admin-media-heading">
        <div>
          <span>Carrousel facultatif</span>
          <h3 id="admin-media-title">Images de galerie</h3>
          <p>Ajoute simplement les images à montrer en carrousel. Cette section peut rester vide.</p>
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
            name="media-upload-file"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={onFileChange}
          />
        </label>

        <label className="admin-field" htmlFor="media-upload-alt">
          <span>Texte alternatif</span>
          <input
            id="media-upload-alt"
            name="media-upload-alt"
            value={uploadForm.alt}
            onChange={(event) => updateUploadField("alt", event.target.value)}
            placeholder="Facultatif"
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

      {!loading && mediaItems.length === 0 ? <p className="admin-media-empty">Aucune image de galerie. Le contenu peut quand même être publié avec un modèle GLB ou Sketchfab.</p> : null}

      {!loading && mediaItems.length > 0 ? (
        <div className="admin-media-list" aria-label="Images du carrousel">
          {mediaItems.map((media) => {
            const form = editForms[media.id] ?? stateFromMedia(media);
            const isBusy = busyMediaId === media.id;

            return (
              <article className="admin-media-card" key={media.id}>
                <a className="admin-media-preview has-media-backdrop" href={media.path} target="_blank" rel="noreferrer" style={mediaBackgroundStyle(media.path)}>
                  <img src={media.path} alt={media.alt ?? "Image du contenu"} loading="lazy" />
                </a>

                <div className="admin-media-fields">
                  <label className="admin-field" htmlFor={`media-alt-${media.id}`}>
                    <span>Texte alternatif</span>
                    <input
                      id={`media-alt-${media.id}`}
                      name={`media-alt-${media.id}`}
                      value={form.alt}
                      onChange={(event) => updateEditField(media.id, "alt", event.target.value)}
                      placeholder="Facultatif"
                    />
                  </label>

                  <p className="admin-media-path">{media.path}</p>
                </div>

                <div className="admin-media-actions">
                  <button className="button button-secondary" type="button" disabled={isBusy} onClick={() => void saveMedia(media)}>
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
