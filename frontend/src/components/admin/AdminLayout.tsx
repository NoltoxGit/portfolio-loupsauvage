import type { ReactNode } from "react";
import type { AuthSession } from "../../types/auth";
import { Footer } from "../layout/Footer";
import { Header } from "../layout/Header";
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
    <div className="admin-page is-authenticated with-public-chrome">
      <Header />
      <main id="main">
        <section className="admin-hero" aria-labelledby="admin-title">
          <div>
            <p className="eyebrow">Espace privé</p>
            <h1 id="admin-title">Gestion du portfolio</h1>
            <p>Ajoute, prépare et publie les créations, ressources marketplace et offres affichées sur le site.</p>
          </div>
        </section>
        <section className="admin-shell">
          <AdminNav currentPath={window.location.pathname} onLogout={onLogout} session={session} />
          <div className="admin-panel">{children}</div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
