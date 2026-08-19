/**
 * backend/src/config/database.ts
 * Inicializa y verifica la salud de la conexión a PostgreSQL con reintentos.
 */

import { prisma } from './prisma';

export const connectDB = async (retries = 3, delayMs = 1500): Promise<void> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('[DB] Conexión a PostgreSQL exitosa via JS Adapter (pg-pool)');
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[DB] Intento ${attempt}/${retries} fallido al conectar: ${message}`);
      
      if (attempt === retries) {
        console.error(`[DB] CRÍTICO: No se pudo establecer conexión inicial: ${message}`);
        if (process.env.NODE_ENV === 'production') {
          throw err;
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
};