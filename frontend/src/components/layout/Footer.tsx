import { useI18n } from "../../i18n/useI18n";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="brand-mark" aria-hidden="true"></span>
          <div>
            <strong>LoupSauvage</strong>
            <p>{t("footer.rights")}</p>
          </div>
        </div>

        <div className="footer-meta" aria-label="Credits du site">
          <span>
            {t("footer.powered")} <strong>HeavenCreation</strong>
          </span>
          <span className="footer-credit">
            <span>{t("footer.created").trim()}&nbsp;</span>
            <strong>
              <a href="https://yorzdraw.fr/" target="_blank" rel="noopener noreferrer">
                YorzStudio
              </a>
            </strong>
          </span>
        </div>
      </div>
    </footer>
  );
}
