import { useEffect, useMemo, useState } from "react";
import {
  createAdminCreationBundle,
  deleteAdminCreationBundle,
  getAdminCreationBundle,
  listAdminContent,
  listAdminCreationBundles,
  reorderAdminCreationBundle,
  syncAdminContentBundles,
  updateAdminCreationBundle,
} from "../../api/admin";
import type { AdminContentItem, AdminCreationBundle } from "../../types/admin";
import type { CreationBundleVisibility } from "../../types/content";
import { AdminError, isUnauthenticatedError } from "./AdminError";

const visibilityLabels: Record<CreationBundleVisibility, string> = {
  public: "Public",
  unlisted: "Non listé",
};

function move<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);

  return next;
}

export function CreationBundlesPanel({
  contentId,
  selectedIds,
  onSelectedIdsChange,
  csrfToken,
  onUnauthenticated,
}: {
  contentId?: number;
  selectedIds: number[];
  onSelectedIdsChange: (ids: number[]) => void;
  csrfToken: string;
  onUnauthenticated: () => void;
}) {
  const [bundles, setBundles] = useState<AdminCreationBundle[]>([]);
  const [creations, setCreations] = useState<AdminContentItem[]>([]);
  const [newBundle, setNewBundle] = useState({ name: "", visibility: "public" as CreationBundleVisibility });
  const [editing, setEditing] = useState<Record<number, { name: string; visibility: CreationBundleVisibility }>>({});
  const [reorderId, setReorderId] = useState<number | null>(null);
  const [reorderItems, setReorderItems] = useState<number[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const creationById = useMemo(() => new Map(creations.map((item) => [item.id, item])), [creations]);

  const handleError = (nextError: unknown) => {
    if (isUnauthenticatedError(nextError)) {
      onUnauthenticated();
      return;
    }

    setError(nextError);
  };

  const refresh = async () => {
    const [nextBundles, nextCreations] = await Promise.all([
      listAdminCreationBundles(),
      listAdminContent({ type: "creation" }),
    ]);
    setBundles(nextBundles);
    setCreations(nextCreations);
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    void refresh()
      .catch(handleError)
      .finally(() => setLoading(false));
  }, []);

  const syncSelection = async (ids: number[]) => {
    onSelectedIdsChange(ids);

    if (!contentId) {
      return;
    }

    await syncAdminContentBundles(contentId, { bundleIds: ids }, csrfToken);
  };

  const toggleBundle = async (id: number) => {
    setError(null);
    setNotice(null);

    const nextIds = selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id];

    try {
      await syncSelection(nextIds);
      setNotice(contentId ? "Bundles de la création mis à jour." : "Bundles prêts à associer après création.");
    } catch (nextError) {
      handleError(nextError);
    }
  };

  const createBundle = async () => {
    const name = newBundle.name.trim();

    if (!name) {
      setNotice("Indique un nom de bundle.");
      return;
    }

    setError(null);
    setNotice(null);

    try {
      const created = await createAdminCreationBundle({ name, visibility: newBundle.visibility }, csrfToken);
      setBundles((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewBundle({ name: "", visibility: "public" });
      setNotice("Bundle créé.");
    } catch (nextError) {
      handleError(nextError);
    }
  };

  const startEdit = (bundle: AdminCreationBundle) => {
    setEditing((current) => ({
      ...current,
      [bundle.id]: {
        name: bundle.name,
        visibility: bundle.visibility,
      },
    }));
  };

  const saveEdit = async (bundle: AdminCreationBundle) => {
    const payload = editing[bundle.id];

    if (!payload || !payload.name.trim()) {
      return;
    }

    setError(null);
    setNotice(null);

    try {
      const updated = await updateAdminCreationBundle(
        bundle.id,
        { name: payload.name.trim(), visibility: payload.visibility },
        csrfToken,
      );
      setBundles((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setEditing((current) => {
        const next = { ...current };
        delete next[bundle.id];
        return next;
      });
      setNotice("Bundle mis à jour.");
    } catch (nextError) {
      handleError(nextError);
    }
  };

  const deleteBundle = async (bundle: AdminCreationBundle) => {
    if (!window.confirm(`Supprimer le bundle "${bundle.name}" ? Les créations restent intactes.`)) {
      return;
    }

    setError(null);
    setNotice(null);

    try {
      await deleteAdminCreationBundle(bundle.id, csrfToken);
      setBundles((current) => current.filter((item) => item.id !== bundle.id));
      onSelectedIdsChange(selectedIds.filter((id) => id !== bundle.id));
      setNotice("Bundle supprimé. Les créations n’ont pas été supprimées.");
    } catch (nextError) {
      handleError(nextError);
    }
  };

  const openReorder = async (bundle: AdminCreationBundle) => {
    setError(null);
    setNotice(null);

    try {
      const detailed = await getAdminCreationBundle(bundle.id);
      setReorderId(bundle.id);
      setReorderItems((detailed.items ?? []).map((item) => item.contentItemId));
    } catch (nextError) {
      handleError(nextError);
    }
  };

  const saveReorder = async () => {
    if (!reorderId) {
      return;
    }

    setError(null);
    setNotice(null);

    try {
      await reorderAdminCreationBundle(reorderId, { contentItemIds: reorderItems }, csrfToken);
      setReorderId(null);
      setReorderItems([]);
      setNotice("Ordre du bundle enregistré.");
      await refresh();
    } catch (nextError) {
      handleError(nextError);
    }
  };

  const reorderBundle = bundles.find((bundle) => bundle.id === reorderId) ?? null;

  return (
    <section className="admin-bundles-panel">
      <div className="admin-form-section-heading">
        <span>Bundles</span>
        <h3>Classement YouTube des créations</h3>
        <p>Une création peut appartenir à plusieurs bundles. Les bundles non listés restent accessibles par lien.</p>
      </div>

      {loading ? <p className="admin-empty">Chargement des bundles...</p> : null}
      <AdminError error={error} />
      {notice ? <p className="admin-status is-visible">{notice}</p> : null}

      <div className="admin-bundle-create">
        <label>
          Nouveau bundle
          <input
            value={newBundle.name}
            onChange={(event) => setNewBundle((current) => ({ ...current, name: event.target.value }))}
            placeholder="Pack dragons"
          />
        </label>
        <label>
          Visibilité
          <select
            value={newBundle.visibility}
            onChange={(event) =>
              setNewBundle((current) => ({ ...current, visibility: event.target.value as CreationBundleVisibility }))
            }
          >
            <option value="public">Public</option>
            <option value="unlisted">Non listé</option>
          </select>
        </label>
        <button className="button button-secondary" type="button" onClick={() => void createBundle()}>
          Créer
        </button>
      </div>

      <div className="admin-bundle-list">
        {bundles.length === 0 ? <p className="admin-empty">Aucun bundle de créations.</p> : null}
        {bundles.map((bundle) => {
          const edit = editing[bundle.id];

          return (
            <article className="admin-bundle-row" key={bundle.id}>
              <label className="admin-check-field">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(bundle.id)}
                  onChange={() => void toggleBundle(bundle.id)}
                />
                <span>
                  <strong>{bundle.name}</strong>
                  <small>
                    {visibilityLabels[bundle.visibility]} · {bundle.itemCount} création
                    {bundle.itemCount > 1 ? "s" : ""}
                  </small>
                </span>
              </label>

              {edit ? (
                <div className="admin-bundle-edit">
                  <input
                    value={edit.name}
                    onChange={(event) =>
                      setEditing((current) => ({
                        ...current,
                        [bundle.id]: { ...edit, name: event.target.value },
                      }))
                    }
                  />
                  <select
                    value={edit.visibility}
                    onChange={(event) =>
                      setEditing((current) => ({
                        ...current,
                        [bundle.id]: { ...edit, visibility: event.target.value as CreationBundleVisibility },
                      }))
                    }
                  >
                    <option value="public">Public</option>
                    <option value="unlisted">Non listé</option>
                  </select>
                  <button className="admin-mini-button" type="button" onClick={() => void saveEdit(bundle)}>
                    OK
                  </button>
                </div>
              ) : (
                <div className="admin-bundle-actions">
                  <button className="admin-mini-button" type="button" onClick={() => startEdit(bundle)}>
                    Renommer
                  </button>
                  <button className="admin-mini-button" type="button" onClick={() => void openReorder(bundle)}>
                    Réordonner
                  </button>
                  <button className="admin-mini-button admin-danger" type="button" onClick={() => void deleteBundle(bundle)}>
                    Supprimer
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {reorderBundle ? (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true" aria-label="Réordonner le bundle">
          <div className="admin-modal-panel">
            <h3>Réordonner {reorderBundle.name}</h3>
            {reorderItems.length === 0 ? <p className="admin-empty">Ce bundle ne contient pas encore de création.</p> : null}
            <div className="admin-reorder-list">
              {reorderItems.map((contentItemId, index) => {
                const item = creationById.get(contentItemId);

                return (
                  <div className="admin-reorder-row" key={contentItemId}>
                    <span>{item?.title ?? `Création #${contentItemId}`}</span>
                    <button
                      className="admin-mini-button"
                      type="button"
                      disabled={index === 0}
                      onClick={() => setReorderItems((current) => move(current, index, index - 1))}
                    >
                      Monter
                    </button>
                    <button
                      className="admin-mini-button"
                      type="button"
                      disabled={index === reorderItems.length - 1}
                      onClick={() => setReorderItems((current) => move(current, index, index + 1))}
                    >
                      Descendre
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="admin-form-actions">
              <button className="button button-primary" type="button" onClick={() => void saveReorder()}>
                Enregistrer l’ordre
              </button>
              <button className="button button-secondary" type="button" onClick={() => setReorderId(null)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
