import { useEffect, useState } from "react";
import { useI18n } from "../../i18n/useI18n";

const homeTarget = (hash: string) => (window.location.pathname === "/" ? hash : `/${hash}`);

export function Header() {
  const { t, toggleLanguage } = useI18n();
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
      <nav className="nav-shell" aria-label={t("ui.mainNav")}>
        <a className="brand" href="/#top" aria-label={t("ui.homeAria")}>
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
          <span className="sr-only">{t("ui.openMenu")}</span>
        </button>

        <div className={`nav-menu${open ? " is-open" : ""}`} id="site-menu" data-menu>
          <a href="/creations" onClick={() => setOpen(false)}>
            {t("nav.creations")}
          </a>
          <a href="/pricing" onClick={() => setOpen(false)}>
            {t("nav.pricing")}
          </a>
          <a href="/marketplace" onClick={() => setOpen(false)}>
            {t("nav.bestSellers")}
          </a>
          <a className="nav-discord" href={homeTarget("#discord")} onClick={() => setOpen(false)}>
            {t("nav.discord")}
          </a>
          <button className="language-toggle" type="button" aria-label={t("ui.languageToggle")} onClick={toggleLanguage}>
            {t("ui.languageShort")}
          </button>
        </div>
      </nav>
    </header>
  );
}
