/**
 * backend/src/config/db.ts
 * Re-exporta el pool singleton de PostgreSQL para evitar duplicación de conexiones en memoria.
 */

export { pool } from './prisma';