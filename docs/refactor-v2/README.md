# Refactor V2 - Portfolio LoupSauvage

Cette documentation cadre la reconstruction complète du portfolio LoupSauvage.

Principe :

- garder le rendu visuel existant ;
- jeter l'ancien back-end ;
- reconstruire proprement avec React/Vite/TypeScript + API PHP + MariaDB ;
- conserver WebStrator et son déploiement manuel ;
- automatiser le build via GitHub Actions ;
- ne jamais versionner les secrets ni les uploads réels.

Ordre de lecture recommandé :

1. `00_CONTEXT.md`
2. `01_STACK_DECISION.md`
3. `02_ARCHITECTURE_TARGET.md`
4. `03_DATABASE_MODEL.md`
5. `04_API_CONTRACT.md`
6. `05_FRONTEND_MIGRATION.md`
7. `06_ADMIN_PANEL.md`
8. `07_DEPLOYMENT_WEBSTRATOR.md`
9. `08_TEST_PLAN.md`
10. `09_GITIGNORE_AND_SECRETS.md`
11. `10_CODEX_PROMPT.md`
12. `11_FIRST_STEPS.md`
