export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="brand-mark" aria-hidden="true"></span>
          <div>
            <strong>LoupSauvage</strong>
            <p>Tous droits reserves.</p>
          </div>
        </div>

        <div className="footer-meta" aria-label="Credits du site">
          <span>
            Propulse par <strong>HeavenCreation</strong>
          </span>
          <span className="footer-credit">
            Created by{" "}
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
