import type { ReactNode } from "react";
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
  return (
    <div data-page={page}>
      <a className="skip-link" href="#main">
        Aller au contenu
      </a>
      <NatureParticles />
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </div>
  );
}
