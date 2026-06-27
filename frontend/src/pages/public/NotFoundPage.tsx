import { Layout } from "../../components/layout/Layout";

export function NotFoundPage() {
  return (
    <Layout page="notFound">
      <section className="creation-detail-empty">
        <p className="eyebrow">Page introuvable</p>
        <h1>Cette page n'existe pas encore</h1>
        <p>Retourne au portfolio pour continuer la visite.</p>
        <a className="button button-primary" href="/">
          Retour a l'accueil
        </a>
      </section>
    </Layout>
  );
}
