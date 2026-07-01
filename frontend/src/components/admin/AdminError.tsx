import { ApiError } from "../../api/client";

const errorMessages: Record<string, string> = {
  VALIDATION_ERROR: "Certains champs doivent être corrigés.",
  DUPLICATE_SLUG: "Ce slug est déjà utilisé.",
  NOT_FOUND: "La ressource demandée est introuvable.",
  CSRF_INVALID: "Session ou action expirée. Recharge la page puis réessaie.",
  UNAUTHENTICATED: "Session admin expirée. Reconnecte-toi.",
  UPLOAD_ERROR: "Envoi impossible. Vérifie le fichier puis réessaie.",
  BUILTBYBIT_TOKEN_MISSING: "Le token BuiltByBit n’est pas configuré sur le serveur.",
  BUILTBYBIT_HTTPS_UNAVAILABLE: "PHP ne peut pas faire de requêtes HTTPS. Active l’extension curl ou openssl.",
  BUILTBYBIT_CURL_FAILED: "La connexion à BuiltByBit a échoué côté serveur.",
  BUILTBYBIT_SCOPE_REQUIRED:
    "Le token BuiltByBit n’a pas le scope requis. Active resources.creator.resources.view dans les paramètres du token API.",
  BUILTBYBIT_CREATOR_SCOPE_REQUIRED:
    "Le token BuiltByBit n’a pas le scope requis. Active resources.creator.resources.view dans les paramètres du token API.",
  BUILTBYBIT_RESOURCE_NOT_OWNED:
    "Cette ressource BuiltByBit n’appartient probablement pas au compte associé au token, ou l’ID est incorrect.",
  BUILTBYBIT_RATE_LIMITED: "BuiltByBit limite temporairement les requêtes. Réessaie dans quelques instants.",
  BUILTBYBIT_AUTH_FAILED: "L’authentification BuiltByBit a échoué côté serveur.",
  BUILTBYBIT_NOT_FOUND: "Cette ressource BuiltByBit est introuvable.",
  BUILTBYBIT_INVALID_RESPONSE: "BuiltByBit a retourné une réponse illisible.",
  BUILTBYBIT_RESPONSE_INCOMPLETE: "La ressource BuiltByBit ne contient pas assez d’informations.",
  BUILTBYBIT_REQUEST_FAILED: "La requête vers BuiltByBit a échoué.",
  BUILTBYBIT_ERROR: "BuiltByBit a retourné une erreur.",
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
