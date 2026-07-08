import { useEffect, useState } from "react";
import { archiveAdminContent, listAdminContent, updateAdminContentStatus } from "../../api/admin";
import { navigateTo } from "../../app/navigation";
import { AdminError, isUnauthenticatedError } from "../../components/admin/AdminError";
import { LoadingState } from "../../components/state/LoadingState";
import { useAsyncData } from "../../hooks/useAsyncData";
import type { ContentStatus, ContentType } from "../../types/content";

function sectionPath(contentType: ContentType) {
  return contentType === "creation" ? "/admin/creations" : "/admin/marketplace";
}

function sectionTitle(contentType: ContentType) {
  return contentType === "creation" ? "Créations" : "Marketplace";
}

function sectionIntro(contentType: ContentType) {
  return contentType === "creation"
    ? "Œuvres, rendus et commissions publiables sur le portfolio."
    : "Ressources vendues ou publiées sur des plateformes externes.";
}

const statusLabels: Record<ContentStatus, string> = {
  draft: "Brouillon",
  published: "En ligne",
  archived: "Supprimé",
};

function formatDate(value: string | null) {
  return value ? value.replace("T", " ").slice(0, 16) : "Non publié";
}

function formatDisplayDate(value: string) {
  return value ? value.slice(0, 10) : "Date non renseignée";
}

function publicationLabel(publishedAt: string | null, displayDate: string) {
  if (publishedAt) {
    return formatDate(publishedAt);
  }

  return formatDisplayDate(displayDate);
}

export function AdminContentListPage({
  contentType,
  csrfToken,
  onUnauthenticated,
}: {
  contentType: ContentType;
  csrfToken: string;
  onUnauthenticated: () => void;
}) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionError, setActionError] = useState<unknown>(null);
  const { data, error, loading } = useAsyncData(() => listAdminContent({ type: contentType }), [contentType, refreshKey]);
  const path = sectionPath(contentType);

  useEffect(() => {
    if (isUnauthenticatedError(error) || isUnauthenticatedError(actionError)) {
      onUnauthenticated();
    }
  }, [actionError, error, onUnauthenticated]);

  const activeItems = data?.filter((item) => item.status !== "archived") ?? [];

  const runAction = async (action: () => Promise<unknown>) => {
    setActionError(null);

    try {
      await action();
      setRefreshKey((current) => current + 1);
    } catch (nextError) {
      if (isUnauthenticatedError(nextError)) {
        onUnauthenticated();
        return;
      }

      setActionError(nextError);
    }
  };

  const deleteItem = (id: number) => {
    if (!window.confirm("Supprimer ce contenu ? Il disparaîtra du site et des listes actives.")) {
      return;
    }

    void runAction(() => archiveAdminContent(id, csrfToken));
  };

  return (
    <>
      <div className="admin-panel-heading admin-heading-actions">
        <div>
          <p className="eyebrow">{contentType === "creation" ? "Portfolio" : "Produits"}</p>
          <h2>{sectionTitle(contentType)}</h2>
          <p>{sectionIntro(contentType)}</p>
        </div>
        <button className="button button-primary" type="button" onClick={() => navigateTo(`${path}/new`)}>
          {contentType === "creation" ? "Nouvelle création" : "Nouvelle ressource"}
        </button>
      </div>

      {loading ? <LoadingState label="Chargement des contenus..." /> : null}
      <AdminError error={error ?? actionError} />

      {!loading && activeItems.length === 0 ? <p className="admin-empty">Aucun contenu actif dans cette section.</p> : null}

      {activeItems.length ? (
        <div className="admin-list">
          {activeItems.map((item) => (
            <article className={`admin-list-item is-${contentType}`} key={item.id}>
              <div className={`admin-list-icon is-${item.status}`}>{statusLabels[item.status]}</div>
              <div className="admin-list-copy">
                <span>{contentType === "creation" ? `/creations/${item.slug}` : item.externalUrl || `/marketplace/${item.slug}`}</span>
                <h3>{item.title}</h3>
                <p>Date de publication {publicationLabel(item.publishedAt, item.displayDate)}</p>
                {contentType === "creation" && item.bundles.length > 0 ? (
                  <div className="admin-bundle-badges">
                    {item.bundles.map((bundle) => (
                      <span className={`admin-bundle-badge is-${bundle.visibility}`} key={bundle.id}>
                        {bundle.name}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="admin-list-actions">
                <button className="admin-mini-button" type="button" onClick={() => navigateTo(`${path}/${item.id}`)}>
                  Éditer
                </button>
                <button className="admin-mini-button" type="button" onClick={() => navigateTo(`${path}/${item.id}/preview`)}>
                  Prévisualiser
                </button>
                {item.status === "draft" ? (
                  <button
                    className="admin-mini-button"
                    type="button"
                    onClick={() => void runAction(() => updateAdminContentStatus(item.id, { status: "published" }, csrfToken))}
                  >
                    Publier
                  </button>
                ) : null}
                {item.status === "published" ? (
                  <button
                    className="admin-mini-button"
                    type="button"
                    onClick={() => void runAction(() => updateAdminContentStatus(item.id, { status: "draft" }, csrfToken))}
                  >
                    Masquer
                  </button>
                ) : null}
                {item.status !== "archived" ? (
                  <button
                    className="admin-mini-button admin-danger"
                    type="button"
                    onClick={() => deleteItem(item.id)}
                  >
                    Supprimer
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </>
  );
}
