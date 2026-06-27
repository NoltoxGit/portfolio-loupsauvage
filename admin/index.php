<?php
declare(strict_types=1);

require_once __DIR__ . '/../api/bootstrap.php';

$adminInitError = false;

try {
    migrate();
    $isAuthenticated = current_admin() !== null;
} catch (Throwable $error) {
    $isAuthenticated = false;
    $adminInitError = true;
}
?>
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="Panel admin local pour gérer les créations, tarifs, packs récents et best sellers LoupSauvage."
    />
    <title>Admin - LoupSauvage</title>
    <link rel="icon" href="https://api.skins.minestrator.com/avatar/LoupSauvage?size=512" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/assets/css/styles.css" />
    <script src="/assets/js/data.js" defer></script>
    <script src="/assets/js/admin.js" defer></script>
  </head>
  <body
    class="admin-page<?php echo $isAuthenticated ? ' is-authenticated' : ''; ?>"
    data-asset-prefix="/"
    data-api-base="/api"
    <?php echo $adminInitError ? 'data-admin-init-error="1"' : ''; ?>
  >
    <a class="skip-link" href="#main">Aller au contenu</a>
    <div class="nature-particles" aria-hidden="true">
      <span class="leaf leaf-one"></span>
      <span class="leaf leaf-two"></span>
      <span class="leaf leaf-three"></span>
      <span class="leaf leaf-four"></span>
      <span class="leaf leaf-five"></span>
      <span class="leaf leaf-six"></span>
      <span class="leaf leaf-seven"></span>
      <span class="leaf leaf-eight"></span>
      <span class="leaf leaf-nine"></span>
      <span class="leaf leaf-ten"></span>
    </div>

    <header class="site-header" data-header>
      <nav class="nav-shell" aria-label="Navigation admin">
        <a class="brand" href="/index.html#top" aria-label="Retour accueil LoupSauvage">
          <span class="brand-mark" aria-hidden="true"></span>
          <span>LoupSauvage</span>
        </a>

        <button class="nav-toggle" type="button" aria-controls="site-menu" aria-expanded="false">
          <span class="nav-toggle-bars" aria-hidden="true"></span>
          <span class="sr-only">Ouvrir le menu</span>
        </button>

        <div class="nav-menu" id="site-menu" data-menu>
          <a href="/index.html#top">Site</a>
          <a href="/creations.html">Toutes les créations</a>
          <a class="nav-discord" href="/index.html#discord">Discord</a>
        </div>
      </nav>
    </header>

    <main id="main">
      <?php if ($isAuthenticated): ?>
      <section class="admin-hero" aria-labelledby="admin-title">
        <div>
          <p class="eyebrow">Panel local</p>
          <h1 id="admin-title">Admin LoupSauvage</h1>
          <p>
            Ajoute, modifie et supprime le contenu du site. Les changements sont
            sauvegardés dans ce navigateur et visibles au prochain chargement du site.
          </p>
        </div>

        <div class="admin-hero-actions">
          <a class="button button-primary" href="/index.html#top">Voir le site</a>
          <button class="button button-secondary" type="button" data-admin-export>Exporter JSON</button>
          <button class="button button-dark admin-remote-only" type="button" data-admin-logout>Déconnexion</button>
          <button class="button button-dark" type="button" data-admin-reset>Réinitialiser</button>
        </div>
      </section>

      <section class="admin-shell" aria-label="Gestion du contenu">
        <aside class="admin-tabs" aria-label="Catégories admin" data-admin-tabs></aside>

        <section class="admin-panel">
          <div class="admin-panel-heading">
            <p class="eyebrow" data-admin-eyebrow>Contenu</p>
            <h2 data-admin-title>Gestion</h2>
            <p data-admin-description></p>
          </div>

          <form class="admin-form" data-admin-form></form>
          <div class="admin-status" data-admin-status role="status" aria-live="polite"></div>
          <div class="admin-list" data-admin-list></div>
        </section>
      </section>
      <?php endif; ?>
    </main>
  </body>
</html>
