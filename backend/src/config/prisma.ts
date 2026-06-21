/**
 * config/prisma.ts
 * Singleton de Prisma Client para PostgreSQL.
 * Utiliza @prisma/adapter-pg (driver adapter) y gestiona un pool nativo para rendimiento óptimo.
 */

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { env } from './env';

const connectionString = `postgresql://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}?schema=public`;

// Crear un pool de conexiones optimizado para limitar recursos en la VPS
const pool = new Pool({
  connectionString,
  max: 20,                       // Máximo de conexiones simultáneas en el pool
  idleTimeoutMillis: 15000,      // Cierra conexiones inactivas tras 15 segundos
  connectionTimeoutMillis: 2000, // Timeout para obtener conexión del pool (2s)
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}