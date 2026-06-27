import { ApiError } from "../../api/client";

const errorMessages: Record<string, string> = {
  VALIDATION_ERROR: "Certains champs doivent etre corriges.",
  DUPLICATE_SLUG: "Ce slug est deja utilise.",
  NOT_FOUND: "La ressource demandee est introuvable.",
  CSRF_INVALID: "Session ou action expiree. Recharge la page puis reessaie.",
  UNAUTHENTICATED: "Session admin expiree. Reconnecte-toi.",
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
