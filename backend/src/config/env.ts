/**
 * config/env.ts
 * Centraliza la lectura y validación de variables de entorno.
 * Agrega aquí nuevas variables a medida que el proyecto crezca.
 */
import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'allmart_super_secret',
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Admin credentials (in-memory, migrate to DB when available)
  ADMIN_USER: process.env.ADMIN_USER || 'admin',
  ADMIN_HASH: process.env.ADMIN_HASH || '$2b$10$zLj./2iqsqnoBqxpT92mVOwUtayNkYy6tL8in443IuB82L905yOau',

  EDITOR_USER: process.env.EDITOR_USER || 'editor',
  EDITOR_HASH: process.env.EDITOR_HASH || '$2b$10$mt.YMa6mFiMmnnxRettsAO/brFQfx1rJQBWFN.HePpYNYtoj7ZRhu',

  // ─── PostgreSQL ───────────────────────────────────────────────────────────
  DB_HOST:     process.env.DB_HOST     || 'localhost',
  DB_PORT:     parseInt(process.env.DB_PORT || '5432', 10),
  DB_USER:     process.env.DB_USER     || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME:     process.env.DB_NAME     || 'allmart_db',
} as const;
