/**
 * config/env.ts
 * Centraliza la lectura y validación de variables de entorno.
 * Agrega aquí nuevas variables a medida que el proyecto crezca.
 */
import dotenv from 'dotenv';
dotenv.config();

const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

export const env = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'allmart_super_secret',
  NODE_ENV: process.env.NODE_ENV || 'development',

  // ─── PostgreSQL ───────────────────────────────────────────────────────────
  DB_HOST:     process.env.DB_HOST     || 'localhost',
  DB_PORT:     parseInt(process.env.DB_PORT || '5432', 10),
  DB_USER:     process.env.DB_USER     || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME:     process.env.DB_NAME     || 'allmart_db',

  // ─── Email / contacto ───────────────────────────────────────────────────
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: Number.isNaN(smtpPort) ? 587 : smtpPort,
  SMTP_SECURE:
    (process.env.SMTP_SECURE || '').toLowerCase() === 'true'
    || (!Number.isNaN(smtpPort) && smtpPort === 465),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || 'Allmart',
  MAIL_FROM_EMAIL: process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER || '',
  FRONTEND_URL: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173',
  ALLMART_WHATSAPP_PHONE: process.env.ALLMART_WHATSAPP_PHONE || '5491165891091',
  // ─── Cloudflare R2 ────────────────────────────────────────────────────────
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID || '',
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || '',
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || '',
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || 'allmart-images',
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || '',
} as const;
