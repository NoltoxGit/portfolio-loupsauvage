import { useEffect, useState } from "react";
import {
  createAdminCreationBundle,
  deleteAdminCreationBundle,
  listAdminCreationBundles,
  syncAdminContentBundles,
  updateAdminCreationBundle,
} from "../../api/admin";
import type { AdminCreationBundle } from "../../types/admin";
import type { CreationBundleVisibility } from "../../types/content";
import { AdminError, isUnauthenticatedError } from "./AdminError";

const visibilityLabels: Record<CreationBundleVisibility, string> = {
  public: "Public",
  unlisted: "Non listé",
};

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
  const [newBundle, setNewBundle] = useState({ name: "", visibility: "public" as CreationBundleVisibility });
  const [editing, setEditing] = useState<Record<number, { name: string; visibility: CreationBundleVisibility }>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const handleError = (nextError: unknown) => {
    if (isUnauthenticatedError(nextError)) {
      onUnauthenticated();
      return;
    }

    setError(nextError);
  };

  const refresh = async () => {
    setBundles(await listAdminCreationBundles());
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

  return (
    <section className="admin-bundles-panel">
      <div className="admin-form-section-heading">
        <span>Bundles</span>
        <h3>Groupes de créations</h3>
        <p>Une création peut appartenir à plusieurs bundles. Les contenus d’un bundle suivent l’ordre chronologique de la galerie.</p>
      </div>

      {loading ? <p className="admin-empty">Chargement des bundles...</p> : null}
      <AdminError error={error} />
      {notice ? <p className="admin-status is-visible">{notice}</p> : null}

      <div className="admin-bundle-create">
        <label htmlFor="creation-bundle-name">
          Nouveau bundle
          <input
            id="creation-bundle-name"
            name="creation-bundle-name"
            value={newBundle.name}
            onChange={(event) => setNewBundle((current) => ({ ...current, name: event.target.value }))}
            placeholder="Pack dragons"
          />
        </label>
        <label htmlFor="creation-bundle-visibility">
          Visibilité
          <select
            id="creation-bundle-visibility"
            name="creation-bundle-visibility"
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
                  id={`creation-bundle-${bundle.id}`}
                  name="creation-bundles"
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
                    id={`creation-bundle-edit-name-${bundle.id}`}
                    name={`creation-bundle-edit-name-${bundle.id}`}
                    value={edit.name}
                    onChange={(event) =>
                      setEditing((current) => ({
                        ...current,
                        [bundle.id]: { ...edit, name: event.target.value },
                      }))
                    }
                  />
                  <select
                    id={`creation-bundle-edit-visibility-${bundle.id}`}
                    name={`creation-bundle-edit-visibility-${bundle.id}`}
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
                  <button className="admin-mini-button admin-danger" type="button" onClick={() => void deleteBundle(bundle)}>
                    Supprimer
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
