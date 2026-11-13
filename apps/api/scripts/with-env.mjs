// Lance une commande (prisma db push, prisma db seed…) après avoir chargé le fichier d'environnement local, s'il existe.
// Sur Render il n'y a pas de fichier : les variables viennent du tableau de bord et ne sont jamais remplacées.
// (`NODE_OPTIONS=--env-file…` n'est pas accepté par Node 22 ; ce petit script fait la même chose partout.)
import { config } from 'dotenv';
import { spawnSync } from 'node:child_process';

config({ path: process.env.ENV_FILE || '.env.render', quiet: true });

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error('Usage : node scripts/with-env.mjs <commande> [arguments]');
  process.exit(2);
}
const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
process.exit(result.status ?? 1);
