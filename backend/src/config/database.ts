/**
 * config/database.ts
 * Inicializa y verifica la salud de la conexión a PostgreSQL.
 */
import { prisma } from './prisma';

export const connectDB = async (): Promise<void> => {
  try {
    // 1. Verificamos la conexión con una query real de salud.
    // Esto asegura que el Pool de 'pg' y el Adapter estén funcionando.
    await prisma.$queryRaw`SELECT 1`;
    
    console.log('[DB] Conexión a PostgreSQL exitosa via JS Adapter (pg-pool)');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[DB] CRÍTICO: No se pudo establecer conexión inicial: ${message}`);
    
    // 2. En desarrollo, a veces es mejor NO matar el proceso por si la DB 
    // tarda en arrancar, pero en un entorno estable, lo ideal es fallar rápido.
    if (process.env.NODE_ENV === 'production') {
        throw err; 
    }
  }
};