// backend/src/config/prisma.ts

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
  max: 10,                       // Máximo de conexiones simultáneas en el pool
  idleTimeoutMillis: 30000,      // Cierra conexiones inactivas tras 30 segundos
  connectionTimeoutMillis: 15000, // Timeout para obtener conexión del pool
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// 🟢 SOLUCIÓN API LENTA: Enforzamos un Singleton absoluto tanto en desarrollo como en producción
// Esto evita que Node.js recree el cliente en cada petición o recarga, previniendo latencias de red
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// Guardamos la instancia de forma global de manera incondicional
globalForPrisma.prisma = prisma;