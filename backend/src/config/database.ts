/**
 * config/database.ts
 * Inicializa y verifica la conexión al pool de PostgreSQL.
 * Llamado una sola vez desde index.ts al arrancar el servidor.
 *
 * El pool en sí vive en config/db.ts y se importa directamente
 * en los servicios/repositorios que lo necesiten.
 */

import { pool } from './db';

export const connectDB = async (): Promise<void> => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT NOW() AS now');
    console.log(`[DB] Conexión a PostgreSQL exitosa — servidor: ${result.rows[0].now}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[DB] No se pudo conectar a PostgreSQL: ${message}`);
    throw err; // Propaga para que bootstrap() llame a process.exit(1)
  } finally {
    client?.release();
  }
};
