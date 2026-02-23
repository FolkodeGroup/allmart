/**
 * index.ts
 * Punto de entrada del servidor.
 * Se encarga únicamente de iniciar el servidor con la app configurada.
 */

import 'dotenv/config';
import app from './app';
import { env } from './config/env';
import { connectDB } from './config/database';

async function bootstrap(): Promise<void> {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`[Server] Escuchando en http://localhost:${env.PORT}`);
    console.log(`[Server] Modo: ${env.NODE_ENV}`);
  });
}

bootstrap().catch((err) => {
  console.error('[Server] Error al iniciar:', err);
  process.exit(1);
});
