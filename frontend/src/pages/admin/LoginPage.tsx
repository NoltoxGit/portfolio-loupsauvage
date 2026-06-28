import { FormEvent, useState } from "react";
import { navigateTo } from "../../app/navigation";
import { Footer } from "../../components/layout/Footer";
import { Header } from "../../components/layout/Header";
import type { AuthState } from "../../hooks/useAuth";
import { useI18n } from "../../i18n/useI18n";

export function LoginPage({ auth, withChrome = true }: { auth: AuthState; withChrome?: boolean }) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    const ok = await auth.login(email, password, rememberMe);
    setSubmitting(false);

    if (ok) {
      navigateTo("/admin");
    }
  };

  const content = (
    <main id="main" className="admin-page">
      <section className="admin-login-panel" aria-labelledby="admin-login-title">
        <div className="admin-login-card">
          <p className="eyebrow">{t("admin.login.eyebrow")}</p>
          <h1 id="admin-login-title">{t("admin.login.title")}</h1>
          <p>{t("admin.login.intro")}</p>

          <form className="admin-login-form" onSubmit={onSubmit}>
            <label className="admin-field" htmlFor="admin-login-email">
              <span>{t("admin.login.email")}</span>
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
              <span>{t("admin.login.password")}</span>
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
            <label className="admin-remember-field" htmlFor="admin-login-remember">
              <input
                id="admin-login-remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>Se souvenir de moi</span>
              <span
                className="admin-info-tooltip"
                tabIndex={0}
                aria-label="Lorsque cette option est activée, la connexion reste active pendant 30 jours sur cet appareil."
              >
                i
              </span>
            </label>
            <button className="button button-primary" type="submit" disabled={submitting}>
              {submitting ? t("admin.login.submitting") : t("admin.login.submit")}
            </button>
          </form>

          {auth.error ? (
            <div className="admin-auth-message is-visible is-error" role="alert">
              {t("admin.login.invalidCredentials", auth.error)}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );

  if (!withChrome) {
    return content;
  }

  return (
    <div className="admin-login-page with-public-chrome">
      <Header />
      {content}
      <Footer />
    </div>
  );
}
