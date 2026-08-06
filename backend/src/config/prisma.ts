// backend/src/config/prisma.ts

/**
 * config/prisma.ts
 * Singleton de Prisma Client y pg.Pool para PostgreSQL.
 * Utiliza @prisma/adapter-pg (driver adapter) y gestiona un pool nativo para rendimiento óptimo.
 */

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { env } from './env';

const connectionString = `postgresql://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}?schema=public`;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

// 🟢 SOLUCIÓN TIMEOUT & LEAKS: Singleton absoluto del Pool en globalThis
// Evita que ts-node-dev cree un nuevo Pool de conexiones en cada reinicio/guardado de archivo
export const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString,
    max: 20,                        // Aumentado a 20 para soportar ráfagas paralelas del frontend
    idleTimeoutMillis: 30000,       // Libera conexiones inactivas a los 30s
    connectionTimeoutMillis: 10000, // Timeout para obtener conexión del pool
    keepAlive: true,                // Mantiene activos los sockets TCP previniendo cierres abruptos
  });

globalForPrisma.pool = pool;

const adapter = new PrismaPg(pool);

// 🟢 Enforzamos Singleton absoluto del PrismaClient
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

globalForPrisma.prisma = prisma;