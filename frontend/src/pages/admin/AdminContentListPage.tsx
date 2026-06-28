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

const statusLabels: Record<ContentStatus, string> = {
  draft: "Brouillon",
  published: "Publié",
  archived: "Archivé",
};

function formatDate(value: string | null) {
  return value ? value.replace("T", " ").slice(0, 16) : "Non publié";
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

  return (
    <>
      <div className="admin-panel-heading admin-heading-actions">
        <div>
          <p className="eyebrow">Contenu</p>
          <h2>{sectionTitle(contentType)}</h2>
          <p>Gestion des contenus {contentType === "creation" ? "portfolio" : "marketplace"}.</p>
        </div>
        <button className="button button-primary" type="button" onClick={() => navigateTo(`${path}/new`)}>
          Nouveau
        </button>
      </div>

      {loading ? <LoadingState label="Chargement des contenus..." /> : null}
      <AdminError error={error ?? actionError} />

      {!loading && data?.length === 0 ? <p className="admin-empty">Aucun contenu dans cette section.</p> : null}

      {data?.length ? (
        <div className="admin-list">
          {data.map((item) => (
            <article className="admin-list-item" key={item.id}>
              <div className="admin-list-icon">{statusLabels[item.status]}</div>
              <div className="admin-list-copy">
                <span>{item.slug}</span>
                <h3>{item.title}</h3>
                <p>
                  ordre {item.sortOrder} · {formatDate(item.publishedAt)}
                </p>
              </div>
              <div className="admin-list-actions">
                <button className="admin-mini-button" type="button" onClick={() => navigateTo(`${path}/${item.id}`)}>
                  Éditer
                </button>
                {(["draft", "published", "archived"] as ContentStatus[]).map((status) => (
                  <button
                    className="admin-mini-button"
                    disabled={item.status === status}
                    key={status}
                    type="button"
                    onClick={() => void runAction(() => updateAdminContentStatus(item.id, { status }, csrfToken))}
                  >
                    {statusLabels[status]}
                  </button>
                ))}
                <button
                  className="admin-mini-button admin-danger"
                  disabled={item.status === "archived"}
                  type="button"
                  onClick={() => void runAction(() => archiveAdminContent(item.id, csrfToken))}
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
