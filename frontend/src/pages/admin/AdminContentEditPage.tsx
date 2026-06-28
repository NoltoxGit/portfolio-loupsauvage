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
  return contentType === "creation" ? "Création" : "Marketplace";
}

function pageTitle(contentType: ContentType, isNew: boolean) {
  if (contentType === "creation") {
    return isNew ? "Nouvelle création" : "Modifier la création";
  }

  return isNew ? "Nouvelle ressource" : "Modifier la ressource";
}

function pageIntro(contentType: ContentType) {
  return contentType === "creation"
    ? "Prépare une œuvre ou une commission avant de la mettre en ligne."
    : "Prépare une ressource vendue ou publiée sur une plateforme externe.";
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
          <h2>{pageTitle(contentType, isNew)}</h2>
          <p>{pageIntro(contentType)}</p>
        </div>
        <div className="admin-heading-button-group">
          {!isNew ? (
            <button className="button button-primary" type="button" onClick={() => navigateTo(`${path}/${id}/preview`)}>
              Prévisualiser
            </button>
          ) : null}
          <button className="button button-secondary" type="button" onClick={() => navigateTo(path)}>
            Retour
          </button>
        </div>
      </div>

      {!isNew && loading ? <LoadingState label="Chargement du contenu..." /> : null}
      <AdminError error={error} />

      {!isNew && data && data.type !== contentType ? (
        <AdminError message="Ce contenu n'appartient pas à cette section admin." />
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
