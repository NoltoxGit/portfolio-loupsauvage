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
  archived: "Archivé",
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

  const archiveItem = (id: number) => {
    if (!window.confirm("Archiver ce contenu ? Il ne sera plus visible publiquement.")) {
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

      {!loading && data?.length === 0 ? <p className="admin-empty">Aucun contenu dans cette section.</p> : null}

      {data?.length ? (
        <div className="admin-list">
          {data.map((item) => (
            <article className={`admin-list-item is-${contentType}`} key={item.id}>
              <div className={`admin-list-icon is-${item.status}`}>{statusLabels[item.status]}</div>
              <div className="admin-list-copy">
                <span>{contentType === "creation" ? `/creations/${item.slug}` : item.externalUrl || `/marketplace/${item.slug}`}</span>
                <h3>{item.title}</h3>
                <p>Date de publication {publicationLabel(item.publishedAt, item.displayDate)}</p>
              </div>
              <div className="admin-list-actions">
                <button className="admin-mini-button" type="button" onClick={() => navigateTo(`${path}/${item.id}`)}>
                  Éditer
                </button>
                <button className="admin-mini-button" type="button" onClick={() => navigateTo(`${path}/${item.id}/preview`)}>
                  Prévisualiser
                </button>
                {item.status !== "published" ? (
                  <button
                    className="admin-mini-button"
                    type="button"
                    onClick={() => void runAction(() => updateAdminContentStatus(item.id, { status: "published" }, csrfToken))}
                  >
                    Mettre en ligne
                  </button>
                ) : null}
                {item.status !== "draft" ? (
                  <button
                    className="admin-mini-button"
                    type="button"
                    onClick={() => void runAction(() => updateAdminContentStatus(item.id, { status: "draft" }, csrfToken))}
                  >
                    Brouillon
                  </button>
                ) : null}
                <button
                  className="admin-mini-button admin-danger"
                  disabled={item.status === "archived"}
                  type="button"
                  onClick={() => archiveItem(item.id)}
                >
                  Archiver
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </>
  );
}
