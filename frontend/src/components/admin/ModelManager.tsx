import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { deleteAdminModel, saveAdminModelPreview, uploadAdminModel } from "../../api/admin";
import type { AdminContentItem, AdminModelInfo } from "../../types/admin";
import { AdminError, isUnauthenticatedError } from "./AdminError";
import { ModelPreviewCard } from "../content/ModelPreviewCard";

interface ModelState {
  modelGlbPath: string | null;
  modelPreviewImagePath: string | null;
  modelWatermarkEnabled: boolean;
}

function modelStateFromItem(item: AdminContentItem): ModelState {
  return {
    modelGlbPath: item.modelGlbPath,
    modelPreviewImagePath: item.modelPreviewImagePath,
    modelWatermarkEnabled: item.modelWatermarkEnabled,
  };
}

function modelStateFromInfo(info: AdminModelInfo): ModelState {
  return {
    modelGlbPath: info.modelGlbPath,
    modelPreviewImagePath: info.modelPreviewImagePath,
    modelWatermarkEnabled: info.modelWatermarkEnabled,
  };
}

export function ModelManager({
  item,
  csrfToken,
  onModelChanged,
  onUnauthenticated,
}: {
  item: AdminContentItem;
  csrfToken: string;
  onModelChanged: (model: ModelState) => void;
  onUnauthenticated: () => void;
}) {
  const [model, setModel] = useState<ModelState>(() => modelStateFromItem(item));
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savingPreview, setSavingPreview] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setModel(modelStateFromItem(item));
    setFile(null);
    setError(null);
    setNotice(null);
  }, [item]);

  const previewItem = useMemo<AdminContentItem>(
    () => ({
      ...item,
      modelGlbPath: model.modelGlbPath,
      modelPreviewImagePath: model.modelPreviewImagePath,
      modelWatermarkEnabled: model.modelWatermarkEnabled,
    }),
    [item, model],
  );

  const handleError = (nextError: unknown) => {
    if (isUnauthenticatedError(nextError)) {
      onUnauthenticated();
      return;
    }

    setError(nextError);
  };

  const uploadModel = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file) {
      setError(null);
      setNotice("Ajoute un fichier .glb avant d’envoyer le modèle.");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".glb")) {
      setError(null);
      setNotice("Le format V1 accepte uniquement les fichiers .glb.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const updated = await uploadAdminModel({ contentItemId: item.id, file }, csrfToken);
      const nextModel = modelStateFromInfo(updated);
      setModel(nextModel);
      onModelChanged(nextModel);
      setFile(null);
      setNotice("Modèle GLB enregistré. La preview sera générée automatiquement.");
    } catch (nextError) {
      handleError(nextError);
    } finally {
      setSubmitting(false);
    }
  };

  const savePreview = useCallback(async (imageData: string) => {
    if (!model.modelGlbPath || model.modelPreviewImagePath || savingPreview) {
      return;
    }

    setSavingPreview(true);

    try {
      const updated = await saveAdminModelPreview({ contentItemId: item.id, imageData }, csrfToken);
      const nextModel = modelStateFromInfo(updated);
      setModel(nextModel);
      onModelChanged(nextModel);
      setNotice("Preview du modèle générée.");
    } catch (nextError) {
      handleError(nextError);
    } finally {
      setSavingPreview(false);
    }
  }, [csrfToken, item.id, model.modelGlbPath, model.modelPreviewImagePath, onModelChanged, onUnauthenticated, savingPreview]);

  const removeModel = async () => {
    if (!model.modelGlbPath || !window.confirm("Supprimer le modèle GLB associé à ce contenu ?")) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const deleted = await deleteAdminModel(item.id, csrfToken);
      const nextModel = modelStateFromInfo(deleted.item);
      setModel(nextModel);
      onModelChanged(nextModel);
      setNotice("Modèle GLB supprimé.");
    } catch (nextError) {
      handleError(nextError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="admin-model-manager">
      <div className="admin-media-heading">
        <div>
          <span>Modèle 3D interne</span>
          <h3>Viewer GLB</h3>
          <p>Associe un fichier .glb au contenu. La preview statique est générée dans le navigateur puis sauvegardée.</p>
        </div>
      </div>

      <form className="admin-model-upload" onSubmit={(event) => void uploadModel(event)}>
        <label className="admin-field" htmlFor="content-model-glb">
          <span>Fichier GLB</span>
          <input id="content-model-glb" type="file" accept=".glb,model/gltf-binary" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        </label>
        <button className="button button-secondary" type="submit" disabled={submitting}>
          {submitting ? "Envoi..." : model.modelGlbPath ? "Remplacer le modèle" : "Ajouter le modèle"}
        </button>
      </form>

      {model.modelGlbPath ? (
        <div className="admin-model-current">
          <ModelPreviewCard item={previewItem} onPreviewGenerated={(imageData) => void savePreview(imageData)} />
          <div className="admin-model-meta">
            <p>Modèle prêt pour le viewer interne.</p>
            {savingPreview ? <p className="admin-status is-visible">Génération de la preview...</p> : null}
            <button className="button button-secondary admin-danger" type="button" disabled={submitting} onClick={() => void removeModel()}>
              Supprimer le modèle
            </button>
          </div>
        </div>
      ) : (
        <p className="admin-media-empty">Aucun modèle GLB associé pour l’instant.</p>
      )}

      <AdminError error={error} />
      {notice ? <p className="admin-status is-visible">{notice}</p> : null}
    </section>
  );
}
