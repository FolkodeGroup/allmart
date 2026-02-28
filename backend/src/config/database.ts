/**
 * config/database.ts
 * Inicializa y verifica la conexión a PostgreSQL usando Prisma Client.
 * Llamado una sola vez desde index.ts al arrancar el servidor.
 */

import { prisma } from './prisma';

export const connectDB = async (): Promise<void> => {
  try {
    // Ejecuta una query simple para verificar la conectividad
    await prisma.$queryRaw`SELECT NOW() AS now`;
    console.log('[DB] Conexión a PostgreSQL exitosa via Prisma Client');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[DB] No se pudo conectar a PostgreSQL: ${message}`);
    throw err; // Propaga para que bootstrap() llame a process.exit(1)
  }
};

