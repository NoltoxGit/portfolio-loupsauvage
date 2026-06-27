<?php
declare(strict_types=1);

// A modifier sur l'hebergement.
const DB_HOST = 'localhost';
const DB_NAME = 'loupsauvage_site';
const DB_USER = 'loupsauvage_user';
const DB_PASS = 'change-moi';
const DB_CHARSET = 'utf8mb4';

// Dossier public ou les images uploadees seront stockees.
const UPLOAD_PUBLIC_DIR = 'uploads';
const UPLOAD_MAX_BYTES = 52428800; // 50 Mo

// Compte cree automatiquement au premier lancement si aucun admin n'existe.
const ADMIN_DEFAULT_USERNAME = 'LoupSauvage';
const ADMIN_DEFAULT_PASSWORD = 'LoupSauvage';

// Token de secours pour reinitialiser le mot de passe depuis l'ecran de login.
// Change-le en production.
const ADMIN_PASSWORD_RESET_TOKEN = 'LoupSauvage-reset';
