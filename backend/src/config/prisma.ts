/**
 * config/prisma.ts
 * Singleton de Prisma Client para PostgreSQL.
 * Utiliza @prisma/adapter-pg (driver adapter) requerido en Prisma 7.
 * Exporta la instancia `prisma` para usarla en todos los servicios.
 *
 * Uso:
 *   import { prisma } from '../config/prisma';
 *   const user = await prisma.user.findUnique({ where: { email } });
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { env } from './env';

const connectionString = `postgresql://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}?schema=public`;

const adapter = new PrismaPg({ connectionString });

// Singleton: en desarrollo se reutiliza para evitar múltiples instancias en hot-reload
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
