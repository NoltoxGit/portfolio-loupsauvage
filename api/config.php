<?php
declare(strict_types=1);

// A modifier sur l'hebergement.
const DB_HOST = '185.207.226.9:3306';
const DB_NAME = 'uncttm_loupsauv_db';
const DB_USER = 'uncttm_loupsauv_db';
const DB_PASS = 'zer*%WQ0!Y8h-I59';
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
