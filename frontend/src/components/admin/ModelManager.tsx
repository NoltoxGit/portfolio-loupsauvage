import { ChangeEvent, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { deleteAdminModel, saveAdminModelPreview, updateAdminModelSettings, uploadAdminModel } from "../../api/admin";
import type { AdminContentItem, AdminModelInfo } from "../../types/admin";
import { AdminError, isUnauthenticatedError } from "./AdminError";
import { ModelPreviewCard } from "../content/ModelPreviewCard";

interface ModelState {
  modelGlbPath: string | null;
  modelPreviewImagePath: string | null;
  modelWatermarkEnabled: boolean;
  modelViewerYawDegrees: number;
}

export interface ModelManagerHandle {
  hasPendingModel: () => boolean;
  uploadPendingModel: (targetItem: AdminContentItem) => Promise<AdminModelInfo | null>;
}

function defaultModelState(): ModelState {
  return {
    modelGlbPath: null,
    modelPreviewImagePath: null,
    modelWatermarkEnabled: true,
    modelViewerYawDegrees: 180,
  };
}

function modelStateFromItem(item: AdminContentItem | null | undefined): ModelState {
  if (!item) {
    return defaultModelState();
  }

  return {
    modelGlbPath: item.modelGlbPath,
    modelPreviewImagePath: item.modelPreviewImagePath,
    modelWatermarkEnabled: item.modelWatermarkEnabled,
    modelViewerYawDegrees: item.modelViewerYawDegrees ?? 180,
  };
}

function modelStateFromInfo(info: AdminModelInfo): ModelState {
  return {
    modelGlbPath: info.modelGlbPath,
    modelPreviewImagePath: info.modelPreviewImagePath,
    modelWatermarkEnabled: info.modelWatermarkEnabled,
    modelViewerYawDegrees: info.modelViewerYawDegrees ?? 180,
  };
}

function normalizeYawDegrees(value: number) {
  const normalized = value % 360;

  return normalized < 0 ? normalized + 360 : normalized;
}

export const ModelManager = forwardRef<
  ModelManagerHandle,
  {
    item?: AdminContentItem | null;
    csrfToken: string;
    onPendingModelChange?: (hasPendingModel: boolean) => void;
    onModelChanged: (model: ModelState) => void;
    onUnauthenticated: () => void;
  }
>(function ModelManager(
  { item, csrfToken, onPendingModelChange, onModelChanged, onUnauthenticated },
  ref,
) {
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
    onPendingModelChange?.(false);
  }, [item?.id, onPendingModelChange]);

  const previewItem = useMemo<AdminContentItem | null>(
    () =>
      item
        ? {
            ...item,
            modelGlbPath: model.modelGlbPath,
            modelPreviewImagePath: model.modelPreviewImagePath,
            modelWatermarkEnabled: model.modelWatermarkEnabled,
            modelViewerYawDegrees: model.modelViewerYawDegrees,
          }
        : null,
    [item, model],
  );

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

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setError(null);

    if (nextFile && !nextFile.name.toLowerCase().endsWith(".glb")) {
      event.target.value = "";
      setFile(null);
      onPendingModelChange?.(false);
      setNotice("Le format V1 accepte uniquement les fichiers .glb.");
      return;
    }

    setFile(nextFile);
    onPendingModelChange?.(Boolean(nextFile));
    setNotice(
      nextFile
        ? item
          ? "Le modèle sera remplacé au prochain enregistrement."
          : "Le modèle sera ajouté automatiquement lors de l’enregistrement."
        : null,
    );
  };

  const uploadPendingModel = useCallback(
    async (targetItem: AdminContentItem) => {
      if (!file) {
        return null;
      }

      setSubmitting(true);
      setError(null);

      try {
        const updated = await uploadAdminModel({ contentItemId: targetItem.id, file }, csrfToken);
        const nextModel = modelStateFromInfo(updated);
        setModel(nextModel);
        onModelChanged(nextModel);
        setFile(null);
        onPendingModelChange?.(false);
        setNotice("Modèle GLB enregistré. L’aperçu est généré automatiquement.");

        return updated;
      } catch (nextError) {
        handleError(nextError);
        throw nextError;
      } finally {
        setSubmitting(false);
      }
    },
    [csrfToken, file, handleError, onModelChanged, onPendingModelChange],
  );

  useImperativeHandle(
    ref,
    () => ({
      hasPendingModel: () => Boolean(file),
      uploadPendingModel,
    }),
    [file, uploadPendingModel],
  );

  const savePreview = useCallback(
    async (imageData: string) => {
      if (!item || !model.modelGlbPath || model.modelPreviewImagePath || savingPreview) {
        return;
      }

      setSavingPreview(true);

      try {
        const updated = await saveAdminModelPreview({ contentItemId: item.id, imageData }, csrfToken);
        const nextModel = modelStateFromInfo(updated);
        setModel(nextModel);
        onModelChanged(nextModel);
        setNotice("Aperçu du modèle généré en haute qualité.");
      } catch (nextError) {
        handleError(nextError);
      } finally {
        setSavingPreview(false);
      }
    },
    [
      csrfToken,
      handleError,
      item,
      model.modelGlbPath,
      model.modelPreviewImagePath,
      onModelChanged,
      savingPreview,
    ],
  );

  const updateOrientation = async (nextYawDegrees: number) => {
    if (!item) {
      setModel((current) => ({ ...current, modelViewerYawDegrees: normalizeYawDegrees(nextYawDegrees) }));
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const updated = await updateAdminModelSettings(
        {
          contentItemId: item.id,
          modelViewerYawDegrees: normalizeYawDegrees(nextYawDegrees),
        },
        csrfToken,
      );
      const nextModel = modelStateFromInfo(updated);
      setModel(nextModel);
      onModelChanged(nextModel);
      setNotice("Orientation mise à jour. L’aperçu va être régénéré.");
    } catch (nextError) {
      handleError(nextError);
    } finally {
      setSubmitting(false);
    }
  };

  const removeModel = async () => {
    if (!item || !model.modelGlbPath || !window.confirm("Supprimer le modèle GLB associé à ce contenu ?")) {
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
          <h3>Fichier GLB</h3>
          <p>
            Dépose un modèle .glb ici. Il sera envoyé automatiquement avec le bouton principal du formulaire.
          </p>
        </div>
      </div>

      <div className="admin-model-upload">
        <label className="admin-field" htmlFor="content-model-glb">
          <span>Modèle GLB</span>
          <input id="content-model-glb" type="file" accept=".glb,model/gltf-binary" onChange={selectFile} />
        </label>
        <div className="admin-model-pending">
          <strong>{file ? file.name : model.modelGlbPath ? "Modèle déjà associé" : "Aucun fichier sélectionné"}</strong>
          <span>
            {file
              ? item
                ? "Remplacement prêt pour le prochain enregistrement."
                : "Ajout automatique après création de la fiche."
              : "Format accepté : .glb uniquement."}
          </span>
        </div>
      </div>

      {model.modelGlbPath && previewItem ? (
        <div className="admin-model-current">
          <ModelPreviewCard item={previewItem} onPreviewGenerated={(imageData) => void savePreview(imageData)} />
          <div className="admin-model-meta">
            <p>Modèle prêt pour le viewer interne.</p>
            <p>Orientation actuelle : {model.modelViewerYawDegrees}°.</p>
            {savingPreview ? <p className="admin-status is-visible">Génération de l’aperçu haute définition...</p> : null}
            <div className="admin-model-orientation-actions">
              <button
                className="button button-secondary"
                type="button"
                disabled={submitting}
                onClick={() => void updateOrientation(model.modelViewerYawDegrees - 90)}
              >
                Pivoter à gauche
              </button>
              <button
                className="button button-secondary"
                type="button"
                disabled={submitting}
                onClick={() => void updateOrientation(model.modelViewerYawDegrees + 180)}
              >
                Corriger l’orientation
              </button>
              <button
                className="button button-secondary"
                type="button"
                disabled={submitting}
                onClick={() => void updateOrientation(model.modelViewerYawDegrees + 90)}
              >
                Pivoter à droite
              </button>
            </div>
            <button className="button button-secondary admin-danger" type="button" disabled={submitting} onClick={() => void removeModel()}>
              Supprimer le modèle
            </button>
          </div>
        </div>
      ) : (
        <p className="admin-media-empty">
          {item ? "Aucun modèle GLB associé pour l’instant." : "Le modèle sélectionné sera envoyé après la création de la fiche."}
        </p>
      )}

      <AdminError error={error} />
      {notice ? <p className="admin-status is-visible">{notice}</p> : null}
    </section>
  );
});
