/**
 * config/db.ts
 * Pool de conexiones a PostgreSQL usando `pg` (node-postgres).
 * Exporta el pool como singleton reutilizable en servicios y repositorios.
 *
 * Uso:
 *   import { pool } from '../config/db';
 *   const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
 */

import { Pool, PoolConfig } from 'pg';
import { env } from './env';

const poolConfig: PoolConfig = {
  host:     env.DB_HOST,
  port:     env.DB_PORT,
  user:     env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,

  // ─── Configuración del pool ──────────────────────────────────────────────
  max:              10,    // Máximo de conexiones simultáneas
  idleTimeoutMillis: 30_000, // Cierra conexiones idle tras 30 s
  connectionTimeoutMillis: 5_000, // Timeout para obtener conexión del pool
};

export const pool = new Pool(poolConfig);

// Loguear warnings del pool en producción
pool.on('error', (err) => {
  console.error('[DB] Error inesperado en cliente del pool:', err.message);
});
