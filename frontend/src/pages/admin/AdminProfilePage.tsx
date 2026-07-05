import { FormEvent, useEffect, useState } from "react";
import {
  createAdminBlockbenchToken,
  getAdminProfile,
  revokeAdminBlockbenchToken,
  updateAdminPassword,
} from "../../api/admin";
import { AdminError, isUnauthenticatedError } from "../../components/admin/AdminError";
import { LoadingState } from "../../components/state/LoadingState";
import { useAsyncData } from "../../hooks/useAsyncData";

function formatDate(value: string | null | undefined) {
  return value ? value.replace("T", " ").slice(0, 16) : "Jamais";
}

export function AdminProfilePage({
  csrfToken,
  onUnauthenticated,
}: {
  csrfToken: string;
  onUnauthenticated: () => void;
}) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [tokenName, setTokenName] = useState("Blockbench poste principal");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [actionError, setActionError] = useState<unknown>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { data, error, loading } = useAsyncData(getAdminProfile, [refreshKey]);

  useEffect(() => {
    if (isUnauthenticatedError(error) || isUnauthenticatedError(actionError)) {
      onUnauthenticated();
    }
  }, [actionError, error, onUnauthenticated]);

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError(null);
    setNotice(null);

    try {
      await updateAdminPassword(passwordForm, csrfToken);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setNotice("Mot de passe mis à jour. La session actuelle reste ouverte.");
    } catch (nextError) {
      setActionError(nextError);
    }
  };

  const createToken = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError(null);
    setNotice(null);
    setNewToken(null);
    setTokenCopied(false);

    try {
      const created = await createAdminBlockbenchToken({ name: tokenName.trim() }, csrfToken);
      setTokenName("");
      setNewToken(created.token);
      setNotice("Clé Blockbench créée. Copie-la maintenant, elle ne sera plus affichée.");
      setRefreshKey((current) => current + 1);
    } catch (nextError) {
      setActionError(nextError);
    }
  };

  const revokeToken = async (id: number) => {
    if (!window.confirm("Révoquer cette clé Blockbench ? Les envois qui l’utilisent seront refusés.")) {
      return;
    }

    setActionError(null);
    setNotice(null);

    try {
      await revokeAdminBlockbenchToken(id, csrfToken);
      setNotice("Clé Blockbench révoquée.");
      setRefreshKey((current) => current + 1);
    } catch (nextError) {
      setActionError(nextError);
    }
  };

  const copyToken = async () => {
    if (!newToken || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(newToken);
    setTokenCopied(true);
    setNotice("Clé copiée dans le presse-papiers.");

    window.setTimeout(() => setTokenCopied(false), 2200);
  };

  return (
    <>
      <div className="admin-panel-heading">
        <p className="eyebrow">Compte</p>
        <h2>Profil</h2>
        <p>Gère l’accès admin et les clés privées utilisées par le plugin Blockbench.</p>
      </div>

      {loading ? <LoadingState label="Chargement du profil..." /> : null}
      <AdminError error={error ?? actionError} />
      {notice ? <div className="admin-auth-message is-success is-visible">{notice}</div> : null}

      {data ? (
        <div className="admin-profile-grid">
          <section className="admin-profile-card">
            <div className="admin-form-section-heading">
              <span>Compte</span>
              <h3>Informations</h3>
            </div>
            <dl className="admin-profile-details">
              <div>
                <dt>Pseudo</dt>
                <dd>{data.user.username}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{data.user.email}</dd>
              </div>
            </dl>
          </section>

          <section className="admin-profile-card">
            <div className="admin-form-section-heading">
              <span>Sécurité</span>
              <h3>Changer le mot de passe</h3>
            </div>
            <form className="admin-profile-form" onSubmit={changePassword}>
              <label>
                Mot de passe actuel
                <input
                  type="password"
                  autoComplete="current-password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                />
              </label>
              <label>
                Nouveau mot de passe
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                />
              </label>
              <label>
                Confirmation
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                  }
                />
              </label>
              <button className="button button-primary" type="submit">
                Mettre à jour
              </button>
            </form>
          </section>

          <section className="admin-profile-card admin-profile-card-wide">
            <div className="admin-form-section-heading">
              <span>Blockbench</span>
              <h3>Clés API privées</h3>
            </div>
            <form className="admin-token-create" onSubmit={createToken}>
              <label>
                Nom de la clé
                <input
                  type="text"
                  value={tokenName}
                  maxLength={120}
                  required
                  placeholder="Blockbench poste principal"
                  onChange={(event) => setTokenName(event.target.value)}
                />
              </label>
              <button className="button button-primary" type="submit">
                Générer une clé
              </button>
            </form>

            {newToken ? (
              <div className="admin-token-once">
                <span>Copie cette clé maintenant. Elle ne sera plus affichée.</span>
                <code>{newToken}</code>
                {navigator.clipboard ? (
                  <button
                    className={`button button-secondary admin-copy-button${tokenCopied ? " is-copied" : ""}`}
                    type="button"
                    onClick={() => void copyToken()}
                  >
                    {tokenCopied ? "Copié" : "Copier"}
                  </button>
                ) : null}
                {tokenCopied ? <span className="admin-copy-confirmation">Copié dans le presse-papiers</span> : null}
              </div>
            ) : null}

            <div className="admin-token-list">
              {data.blockbenchTokens.length === 0 ? <p className="admin-empty">Aucune clé Blockbench.</p> : null}
              {data.blockbenchTokens.map((token) => (
                <article className="admin-token-row" key={token.id}>
                  <div>
                    <strong>{token.name}</strong>
                    <span>{token.tokenPrefix}...</span>
                  </div>
                  <div>
                    <span>Créée</span>
                    <strong>{formatDate(token.createdAt)}</strong>
                  </div>
                  <div>
                    <span>Dernière utilisation</span>
                    <strong>{formatDate(token.lastUsedAt)}</strong>
                  </div>
                  <div>
                    <span>Statut</span>
                    <strong>{token.revokedAt ? `Révoquée le ${formatDate(token.revokedAt)}` : "Active"}</strong>
                  </div>
                  {!token.revokedAt ? (
                    <button className="admin-mini-button admin-danger" type="button" onClick={() => void revokeToken(token.id)}>
                      Révoquer
                    </button>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
