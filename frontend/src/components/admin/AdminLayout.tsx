import type { ReactNode } from "react";
import type { AuthSession } from "../../types/auth";
import { AdminNav } from "./AdminNav";

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
        </section>
        <section className="admin-shell">
          <AdminNav currentPath={window.location.pathname} onLogout={onLogout} />
          <div className="admin-panel">{children}</div>
        </section>
      </main>
    </div>
  );
}
