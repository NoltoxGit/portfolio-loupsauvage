# 10 - Prompt Codex principal

Copier ce prompt dans Codex après avoir ajouté tous les fichiers de préparation dans le repo.

```txt
Tu agis comme un développeur senior full-stack spécialisé React, Vite, TypeScript, PHP 8.x, MariaDB, sécurité web, architecture back-end et refactorisation progressive.

Projet : portfolio LoupSauvage.

Contexte métier :
Le site est un portfolio pour une modélisatrice 3D spécialisée dans les modèles Blockbench/Minecraft. Il présente des créations personnelles, des commissions privées rendues publiques avec accord client, des ressources marketplace vendues ou publiées sur BuildByBit/MCModels, ainsi que des offres de tarification. Le site doit avoir un panel admin privé pour gérer les créations, la marketplace et les tarifs.

Hébergement :
- WebStrator.
- PHP 8.5 disponible selon les informations actuelles.
- MariaDB disponible en production.
- Accès serveur uniquement par SFTP/WinSCP, pas de SSH.
- WebStrator déploie depuis GitHub manuellement.
- WebStrator peut choisir la branche à déployer.
- WebStrator conserve /uploads lors d'un déploiement Git.
- WebStrator supporte .htaccess Apache.

Décision technique :
- Front public : React + Vite + TypeScript.
- Admin : React + Vite + TypeScript.
- Back-end : nouvelle API PHP maison structurée.
- Base de données : MariaDB.
- Build : GitHub Actions vers une branche webstrator-build.
- Déploiement final : manuel depuis WebStrator.

Règle fondamentale :
Ne pas réparer l'ancien back-end. Le back-end actuel est considéré comme jetable. Il faut repartir proprement.

L'ancien HTML/CSS/JavaScript doit uniquement servir de référence visuelle et comportementale. Le rendu final doit rester visuellement identique ou quasi identique au site existant. Ne pas proposer de refonte graphique sans demande explicite.

Pages publiques cible :
- /
- /creations
- /creations/:slug
- /marketplace
- /pricing

Pages admin cible :
- /admin/login
- /admin/dashboard
- /admin/creations
- /admin/creations/new
- /admin/creations/:id
- /admin/marketplace
- /admin/marketplace/new
- /admin/marketplace/:id
- /admin/pricing
- /admin/pricing/new
- /admin/pricing/:id

Page interdite :
- Ne pas créer /admin/settings.

Rôles :
- owner : accès admin.
- viewer : visiteur public implicite.
Il ne doit y avoir aucun bouton visible vers l'admin sur le site public.

Tâche initiale :
1. Lis tous les fichiers dans docs/refactor-v2/.
2. Analyse la structure actuelle du repo uniquement pour identifier les éléments front visuels à préserver.
3. Ne modifie pas encore tout le projet d'un coup.
4. Propose d'abord un plan d'exécution technique en phases courtes.
5. Ensuite, commence uniquement par la phase 1 : préparer la structure cible sans casser le site existant.

Contraintes de sécurité :
- Aucun secret réel dans Git.
- Utiliser api/config/config.example.php comme modèle.
- Les fichiers config.local.php et config.production.php doivent rester ignorés.
- Utiliser PDO et requêtes préparées.
- Utiliser password_hash/password_verify.
- Protéger les endpoints admin par session owner.
- Valider les uploads avec fileinfo.
- Interdire l'exécution PHP dans /uploads.

Critères d'acceptation globaux :
- Le site public reste visuellement fidèle à l'existant.
- Les créations ajoutées dans l'admin apparaissent publiquement seulement si publiées.
- Les commissions privées ne peuvent pas être publiées sans accord client.
- Les ressources marketplace gèrent BuildByBit, MCModels, Sketchfab et autres liens.
- Les tarifs sont modifiables depuis /admin/pricing.
- Aucun lien admin n'est visible sur le site public.
- Le build Vite fonctionne.
- Le workflow GitHub Actions peut publier une branche webstrator-build.
- Les uploads sont conservés hors Git.
- La production WebStrator peut utiliser MariaDB et la config production non versionnée.

Important :
Travaille en petits commits logiques. Évite les gros changements non testables. Explique chaque étape avant d'appliquer une modification massive.
```
