/**
 * src/scripts/migrate.ts
 * Runner de migraciones SQL.
 *
 * - Lee archivos .sql de la carpeta /migrations en orden alfanumérico.
 * - Mantiene un registro de migraciones ejecutadas en la tabla schema_migrations.
 * - Solo ejecuta las migraciones pendientes (idempotente).
 *
 * Uso:
 *   npm run migrate
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { env } from '../config/env';

// ─── Pool de conexión ─────────────────────────────────────────────────────────
const pool = new Pool({
  host:     env.DB_HOST,
  port:     env.DB_PORT,
  user:     env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
});

// ─── Ruta a la carpeta de migraciones ────────────────────────────────────────
const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function ensureMigrationsTable(client: import('pg').PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         SERIAL      PRIMARY KEY,
      filename   VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations(client: import('pg').PoolClient): Promise<Set<string>> {
  const { rows } = await client.query<{ filename: string }>(
    'SELECT filename FROM schema_migrations ORDER BY id ASC',
  );
  return new Set(rows.map((r) => r.filename));
}

async function applyMigration(
  client: import('pg').PoolClient,
  filename: string,
  sql: string,
): Promise<void> {
  console.log(`  → Aplicando: ${filename}`);
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query(
      'INSERT INTO schema_migrations (filename) VALUES ($1)',
      [filename],
    );
    await client.query('COMMIT');
    console.log(`  ✅ ${filename}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function runMigrations(): Promise<void> {
  console.log('[Migrate] Iniciando migraciones…');

  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);

    const applied = await getAppliedMigrations(client);

    // Obtener y ordenar archivos .sql
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const pending = files.filter((f) => !applied.has(f));

    if (pending.length === 0) {
      console.log('[Migrate] No hay migraciones pendientes.');
      return;
    }

    for (const file of pending) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
      await applyMigration(client, file, sql);
    }

    console.log(`[Migrate] ${pending.length} migración(es) aplicada(s) correctamente.`);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error('[Migrate] Error:', err.message);
  process.exit(1);
});
