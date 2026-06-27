import { useEffect } from "react";
import { getAdminContent } from "../../api/admin";
import { navigateTo } from "../../app/navigation";
import { AdminError, isUnauthenticatedError } from "../../components/admin/AdminError";
import { ContentForm } from "../../components/admin/ContentForm";
import { LoadingState } from "../../components/state/LoadingState";
import { useAsyncData } from "../../hooks/useAsyncData";
import type { AdminContentItem } from "../../types/admin";
import type { ContentType } from "../../types/content";

function sectionPath(contentType: ContentType) {
  return contentType === "creation" ? "/admin/creations" : "/admin/marketplace";
}

function sectionTitle(contentType: ContentType) {
  return contentType === "creation" ? "Creation" : "Marketplace";
}

export function AdminContentEditPage({
  contentType,
  id,
  csrfToken,
  onUnauthenticated,
}: {
  contentType: ContentType;
  id?: number;
  csrfToken: string;
  onUnauthenticated: () => void;
}) {
  const isNew = id === undefined;
  const path = sectionPath(contentType);
  const { data, error, loading } = useAsyncData<AdminContentItem>(() => {
    if (id === undefined) {
      return Promise.resolve(null as unknown as AdminContentItem);
    }

    return getAdminContent(id);
  }, [id]);

  useEffect(() => {
    if (isUnauthenticatedError(error)) {
      onUnauthenticated();
    }
  }, [error, onUnauthenticated]);

  const onSaved = (item: AdminContentItem) => {
    if (isNew) {
      navigateTo(`${path}/${item.id}`);
    }
  };

  return (
    <>
      <div className="admin-panel-heading admin-heading-actions">
        <div>
          <p className="eyebrow">{sectionTitle(contentType)}</p>
          <h2>{isNew ? "Nouveau contenu" : "Edition contenu"}</h2>
          <p>{contentType === "creation" ? "Type fixe : creation." : "Type fixe : marketplace."}</p>
        </div>
        <button className="button button-secondary" type="button" onClick={() => navigateTo(path)}>
          Retour
        </button>
      </div>

      {!isNew && loading ? <LoadingState label="Chargement du contenu..." /> : null}
      <AdminError error={error} />

      {!isNew && data && data.type !== contentType ? (
        <AdminError message="Ce contenu n'appartient pas a cette section admin." />
      ) : null}

      {(isNew || (data && data.type === contentType)) && !loading ? (
        <ContentForm
          contentType={contentType}
          csrfToken={csrfToken}
          initialItem={isNew ? null : data}
          onSaved={onSaved}
          onArchived={() => navigateTo(path)}
          onUnauthenticated={onUnauthenticated}
        />
      ) : null}
    </>
  );
}
