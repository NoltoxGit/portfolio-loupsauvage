import { navigateTo } from "../../app/navigation";
import type { AuthSession } from "../../types/auth";

const navItems = [
  { href: "/admin", eyebrow: "Accueil", label: "Tableau de bord" },
  { href: "/admin/creations", eyebrow: "Portfolio", label: "Créations" },
  { href: "/admin/marketplace", eyebrow: "Produits", label: "Marketplace" },
  { href: "/admin/pricing", eyebrow: "Vente", label: "Tarifs" },
  { href: "/admin/profile", eyebrow: "Compte", label: "Profil" },
];

export function AdminNav({
  currentPath,
  onLogout,
  session,
}: {
  currentPath: string;
  onLogout: () => void;
  session: AuthSession;
}) {
  return (
    <aside className="admin-nav-shell" aria-label="Navigation admin">
      <nav className="admin-tabs">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin" ? currentPath === "/admin" : currentPath === item.href || currentPath.startsWith(`${item.href}/`);

          return (
            <a
              key={item.href}
              className={`admin-tab${isActive ? " is-active" : ""}`}
              href={item.href}
              onClick={(event) => {
                event.preventDefault();
                navigateTo(item.href);
              }}
            >
              <span>{item.eyebrow}</span>
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="admin-session-card">
        <span>Session</span>
        <strong>{session.user.username}</strong>
        <button className="button button-secondary admin-logout-button" type="button" onClick={onLogout}>
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
