import { navigateTo } from "../../app/navigation";

const navItems = [
  { href: "/admin", eyebrow: "Vue", label: "Dashboard" },
  { href: "/admin/creations", eyebrow: "Content", label: "Creations" },
  { href: "/admin/marketplace", eyebrow: "Content", label: "Marketplace" },
  { href: "/admin/pricing", eyebrow: "Offres", label: "Pricing" },
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
        Logout
      </button>
    </nav>
  );
}
