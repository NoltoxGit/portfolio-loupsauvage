import { useEffect, useState } from "react";

const homeTarget = (hash: string) => (window.location.pathname === "/" ? hash : `/${hash}`);

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("nav-open", open);
    return () => document.body.classList.remove("nav-open");
  }, [open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`} data-header>
      <nav className="nav-shell" aria-label="Navigation principale">
        <a className="brand" href="/#top" aria-label="Accueil LoupSauvage">
          <span className="brand-mark" aria-hidden="true"></span>
          <span>LoupSauvage</span>
        </a>

        <button
          className="nav-toggle"
          type="button"
          aria-controls="site-menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="nav-toggle-bars" aria-hidden="true"></span>
          <span className="sr-only">Ouvrir le menu</span>
        </button>

        <div className={`nav-menu${open ? " is-open" : ""}`} id="site-menu" data-menu>
          <a href="/creations" onClick={() => setOpen(false)}>
            Creations
          </a>
          <a href="/pricing" onClick={() => setOpen(false)}>
            Tarifs
          </a>
          <a href="/marketplace" onClick={() => setOpen(false)}>
            Best sellers
          </a>
          <a className="nav-discord" href={homeTarget("#discord")} onClick={() => setOpen(false)}>
            Discord
          </a>
          <button className="language-toggle" type="button" aria-label="Changer la langue">
            EN
          </button>
        </div>
      </nav>
    </header>
  );
}
