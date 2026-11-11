import { config } from 'dotenv';

/**
 * Fichier d'environnement local : `.env.render` (ou celui de la variable ENV_FILE). dotenv ne remplace jamais
 * une variable déjà définie : celles du système (Render, tableau de bord) priment toujours sur le fichier.
 */
config({ path: process.env.ENV_FILE || '.env.render', quiet: true });
