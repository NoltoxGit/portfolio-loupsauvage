import { useEffect, type ReactNode } from "react";
import { useI18n } from "../../i18n/useI18n";
import { Footer } from "./Footer";
import { Header } from "./Header";

function NatureParticles() {
  return (
    <div className="nature-particles" aria-hidden="true">
      {Array.from({ length: 10 }, (_, index) => (
        <span key={index} className={`leaf leaf-${["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][index]}`}></span>
      ))}
    </div>
  );
}

export function Layout({ children, page }: { children: ReactNode; page: string }) {
  const { t } = useI18n();

  useEffect(() => {
    const title = t(`pages.${page}.title`, "LoupSauvage");
    const description = t(`pages.${page}.description`, "");
    document.title = title;

    if (description) {
      let metaDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement("meta");
        metaDescription.name = "description";
        document.head.appendChild(metaDescription);
      }

      metaDescription.content = description;
    }
  }, [page, t]);

  return (
    <div data-page={page}>
      <a className="skip-link" href="#main">
        {t("ui.skip")}
      </a>
      <NatureParticles />
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </div>
  );
}
