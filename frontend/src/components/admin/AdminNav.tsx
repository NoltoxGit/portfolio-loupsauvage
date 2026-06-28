import { navigateTo } from "../../app/navigation";

const navItems = [
  { href: "/admin", eyebrow: "Vue", label: "Tableau de bord" },
  { href: "/admin/creations", eyebrow: "Contenu", label: "Créations" },
  { href: "/admin/marketplace", eyebrow: "Contenu", label: "Marketplace" },
  { href: "/admin/pricing", eyebrow: "Offres", label: "Tarifs" },
];

export function AdminNav({ currentPath, onLogout }: { currentPath: string; onLogout: () => void }) {
  return (
    <nav className="admin-tabs" aria-label="Navigation admin">
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
      <button className="admin-tab" type="button" onClick={onLogout}>
        <span>Session</span>
        Déconnexion
      </button>
    </nav>
  );
}
