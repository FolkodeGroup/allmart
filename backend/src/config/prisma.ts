/**
 * backend/src/config/prisma.ts
 * Singleton robusto de Prisma Client y pg.Pool para PostgreSQL.
 * Optimizado para alta concurrencia y entornos virtualizados (Docker/DevContainers/WSL2).
 */

import { Pool, PoolConfig } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { env } from './env';

const connectionString = `postgresql://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}?schema=public`;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

const poolConfig: PoolConfig = {
  connectionString,
  max: 25,                            // Soporta ráfagas paralelas del frontend sin saturarse
  min: 2,                             // Mantiene al menos 2 conexiones calientes listas
  idleTimeoutMillis: 10000,           // Libera conexiones inactivas a los 10s para evitar zombies
  connectionTimeoutMillis: 0,         // 🟢 0 = Esperar turno en cola en ráfagas en lugar de matar la petición
  keepAlive: true,                    // Envía señales TCP keep-alive
  keepAliveInitialDelayMillis: 5000,  // Envía keep-alive cada 5s para que Docker no cierre el socket
};

export const pool =
  globalForPrisma.pool ??
  new Pool(poolConfig);

// 🟢 Captura y purga del pool cualquier socket cortado por el servidor o la red
pool.on('error', (err) => {
  console.warn('[DB Pool] Socket inactivo reiniciado por el servidor de base de datos:', err.message);
});

globalForPrisma.pool = pool;

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

globalForPrisma.prisma = prisma;