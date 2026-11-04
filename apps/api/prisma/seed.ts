import 'dotenv/config';

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { hashPassword } from '../src/auth/mot-de-passe';

/**
 * Crée (ou réaligne) le compte administrateur servi par la base elle-même.
 *
 * Les identifiants viennent exclusivement de l'environnement :
 *   ADMIN_EMAIL     défaut `mxhackx@gmail.com`
 *   ADMIN_PASSWORD  obligatoire, jamais stocké en clair — seul son hachage
 *                   scrypt est écrit dans `admin_users.password_hash`
 *
 * Le script est idempotent : relancé, il met à jour le hachage pour que `.env`
 * reste la source de vérité. Le mot de passe n'est jamais affiché.
 */

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
  console.error(
    'DATABASE_URL (ou DIRECT_URL) introuvable. Renseignez .env avant de lancer le seed.',
  );
  process.exit(1);
}

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'mxhackx@gmail.com').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    console.error(
      'ADMIN_PASSWORD est vide dans .env : le seed refuse de deviner un mot de passe.',
    );
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const existing = await prisma.adminUser.findUnique({ where: { email } });

  if (existing) {
    await prisma.adminUser.update({
      where: { email },
      data: { passwordHash, role: 'admin' },
    });
    console.log(`Compte admin réaligné sur .env : ${email} (hachage scrypt remplacé)`);
  } else {
    await prisma.adminUser.create({
      data: { email, passwordHash, role: 'admin' },
    });
    console.log(`Compte admin créé : ${email} (hachage scrypt N=16384, r=8, p=1)`);
  }

  const total = await prisma.adminUser.count();
  console.log(`admin_users contient désormais ${total} compte(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
