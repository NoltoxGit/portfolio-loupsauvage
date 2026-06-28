import { ApiError } from "../../api/client";

const errorMessages: Record<string, string> = {
  VALIDATION_ERROR: "Certains champs doivent être corrigés.",
  DUPLICATE_SLUG: "Ce slug est déjà utilisé.",
  NOT_FOUND: "La ressource demandée est introuvable.",
  CSRF_INVALID: "Session ou action expirée. Recharge la page puis réessaie.",
  UNAUTHENTICATED: "Session admin expirée. Reconnecte-toi.",
  UPLOAD_ERROR: "Envoi impossible. Vérifie le fichier puis réessaie.",
};

export function isUnauthenticatedError(error: unknown) {
  return error instanceof ApiError && error.code === "UNAUTHENTICATED";
}

export function AdminError({ error, message }: { error?: unknown; message?: string | null }) {
  if (!error && !message) {
    return null;
  }

  const apiError = error instanceof ApiError ? error : null;
  const fields = apiError?.fields ?? {};
  const label = message ?? (apiError ? errorMessages[apiError.code] ?? apiError.message : "Une erreur est survenue.");

  return (
    <div className="admin-auth-message is-error is-visible" role="alert">
      <p>{label}</p>
      {Object.keys(fields).length > 0 ? (
        <ul className="admin-error-fields">
          {Object.entries(fields)
            .filter(([, fieldMessage]) => fieldMessage)
            .map(([field, fieldMessage]) => (
              <li key={field}>
                <strong>{field}</strong> : {fieldMessage}
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  );
}
