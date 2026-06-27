# LoupSauvage MariaDB backend

## Installation

1. Cree une base MariaDB vide, par exemple `loupsauvage_site`.
2. Modifie `api/config.php` avec les identifiants de ta base.
3. Verifie que PHP a les extensions `pdo_mysql` et `fileinfo`.
4. Verifie que le dossier `uploads/` est envoye sur l'hebergement et qu'il est inscriptible par PHP.
5. Pour les uploads de 50 Mo, mets au minimum `upload_max_filesize=50M` et `post_max_size=60M`.
6. Ouvre `/admin` sur le site heberge.

Au premier chargement, les tables sont creees automatiquement. Les images sont stockees dans `uploads/`, MariaDB garde seulement les chemins.

## Acces admin par defaut

- Login: `LoupSauvage`
- Mot de passe: `LoupSauvage`

Change le mot de passe apres la premiere connexion. Le token de reset se configure dans `api/config.php`.
