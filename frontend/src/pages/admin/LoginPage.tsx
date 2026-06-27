import { FormEvent, useState } from "react";
import type { AuthState } from "../../hooks/useAuth";

export function LoginPage({ auth }: { auth: AuthState }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    const ok = await auth.login(email, password);
    setSubmitting(false);

    if (ok) {
      window.history.pushState({}, "", "/admin");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  return (
    <main id="main" className="admin-page">
      <section className="admin-login-panel" aria-labelledby="admin-login-title">
        <div className="admin-login-card">
          <p className="eyebrow">Acces securise</p>
          <h1 id="admin-login-title">Connexion admin</h1>
          <p>Connecte-toi avec un compte owner local.</p>

          <form className="admin-login-form" onSubmit={onSubmit}>
            <label className="admin-field" htmlFor="admin-login-email">
              <span>Email</span>
              <input
                id="admin-login-email"
                name="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="admin-field" htmlFor="admin-login-password">
              <span>Mot de passe</span>
              <input
                id="admin-login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <button className="button button-primary" type="submit" disabled={submitting}>
              {submitting ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          {auth.error ? (
            <div className="admin-auth-message is-visible is-error" role="alert">
              {auth.error}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
