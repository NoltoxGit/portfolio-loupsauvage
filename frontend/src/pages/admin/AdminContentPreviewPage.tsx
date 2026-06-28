import { useEffect } from "react";
import { getAdminContent } from "../../api/admin";
import { navigateTo } from "../../app/navigation";
import { AdminError, isUnauthenticatedError } from "../../components/admin/AdminError";
import { ContentPreview } from "../../components/admin/ContentPreview";
import { LoadingState } from "../../components/state/LoadingState";
import { useAsyncData } from "../../hooks/useAsyncData";
import type { AdminContentItem } from "../../types/admin";
import type { ContentType } from "../../types/content";

function sectionPath(contentType: ContentType) {
  return contentType === "creation" ? "/admin/creations" : "/admin/marketplace";
}

function sectionTitle(contentType: ContentType) {
  return contentType === "creation" ? "Prévisualisation création" : "Prévisualisation marketplace";
}

export function AdminContentPreviewPage({
  contentType,
  id,
  onUnauthenticated,
}: {
  contentType: ContentType;
  id: number;
  onUnauthenticated: () => void;
}) {
  const path = sectionPath(contentType);
  const { data, error, loading } = useAsyncData<AdminContentItem>(() => getAdminContent(id), [id]);

  useEffect(() => {
    if (isUnauthenticatedError(error)) {
      onUnauthenticated();
    }
  }, [error, onUnauthenticated]);

  return (
    <>
      <div className="admin-panel-heading admin-heading-actions">
        <div>
          <p className="eyebrow">Aperçu privé</p>
          <h2>{sectionTitle(contentType)}</h2>
          <p>Cette page est protégée par la session admin et ne publie pas le contenu.</p>
        </div>
        <div className="admin-heading-button-group">
          <button className="button button-secondary" type="button" onClick={() => navigateTo(`${path}/${id}`)}>
            Modifier
          </button>
          <button className="button button-secondary" type="button" onClick={() => navigateTo(path)}>
            Retour
          </button>
        </div>
      </div>

      {loading ? <LoadingState label="Chargement de la prévisualisation..." /> : null}
      <AdminError error={error} />

      {data && data.type !== contentType ? <AdminError message="Ce contenu n'appartient pas à cette section admin." /> : null}
      {data && data.type === contentType && !loading ? <ContentPreview item={data} /> : null}
    </>
  );
}
