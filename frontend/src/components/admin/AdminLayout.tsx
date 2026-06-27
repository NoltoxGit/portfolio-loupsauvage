import type { ReactNode } from "react";
import type { AuthSession } from "../../types/auth";

export function AdminLayout({
  children,
  session,
  onLogout,
}: {
  children: ReactNode;
  session: AuthSession;
  onLogout: () => void;
}) {
  return (
    <div className="admin-page is-authenticated">
      <main id="main">
        <section className="admin-hero" aria-labelledby="admin-title">
          <div>
            <p className="eyebrow">Administration</p>
            <h1 id="admin-title">LoupSauvage</h1>
            <p>Connecte en tant que {session.user.email}.</p>
          </div>
          <div className="admin-hero-actions">
            <button className="button button-secondary" type="button" onClick={onLogout}>
              Deconnexion
            </button>
          </div>
        </section>
        <section className="admin-shell">
          <nav className="admin-tabs" aria-label="Navigation admin">
            <a className="admin-tab is-active" href="/admin">
              <span>Phase 4A</span>
              Dashboard
            </a>
          </nav>
          <div className="admin-panel">{children}</div>
        </section>
      </main>
    </div>
  );
}
