/**
 * app.ts
 * Configuración de la aplicación Express.
 * Separa la inicialización de la app del arranque del servidor
 * para facilitar testing y entornos múltiples.
 */

import express from 'express';
import cors from 'cors';
import apiRouter from './routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// ─── Middlewares globales ──────────────────────────────────────────────────────
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ success: true, message: 'Backend Allmart funcionando' });
});

// ─── Rutas de la API ──────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ─── Manejo global de errores (DEBE ir al final) ───────────────────────────────
app.use(errorHandler);

export default app;
