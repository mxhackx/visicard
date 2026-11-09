import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { PrismaClient } from "@prisma/client";

import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

    if (!connectionString) {
      throw new Error(
        "Aucune variable de connexion à la base de données (DATABASE_URL ou DIRECT_URL) n'est définie dans l'environnement.",
      );
    }

    const pool = new Pool({
      connectionString,
      // Peu de connexions : le pooler Supabase en limite le nombre, et l'API gratuite a peu de mémoire.
      max: Number(process.env.DB_POOL_MAX) || 5,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 15_000,
      keepAlive: true,
    });
    // Le pooler coupe les connexions inactives : sans écouteur, cet évènement « error » faisait
    // tomber tout le processus (502 en série). Le pool rouvre simplement une connexion au besoin.
    pool.on('error', (error) => {
      new Logger('Database').warn(`Connexion inactive fermée : ${error.message}`);
    });

    const adapter = new PrismaPg(pool);

    super({
      adapter,
    });

    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}