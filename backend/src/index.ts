/**
 * index.ts
 * Punto de entrada del servidor.
 * Se encarga únicamente de iniciar el servidor con la app configurada.
 */

import 'dotenv/config';
import app from './app';
import { env } from './config/env';
import { connectDB } from './config/database';
import { removeExpiredNovedadTags } from './jobs/removeNovedadTag';
import { syncAllAutoCollections } from './jobs/collectionsJob';
import { cleanAbandonedCarts } from './jobs/cleanAbandonedCarts';

async function bootstrap(): Promise<void> {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`[Server] Escuchando en http://localhost:${env.PORT}`);
    console.log(`[Server] Modo: ${env.NODE_ENV}`);
    
    // ─── Ejecución inicial de tareas en segundo plano al arrancar el servidor ───
    removeExpiredNovedadTags().catch((err) => {
      console.error('[Server] Error al remover etiquetas Novedad expiradas (inicio):', err);
    });

    syncAllAutoCollections()
      .then((res) => {
        console.log(
          `[Server] Sincronización de colecciones automática completada (inicio): ${res.synced} sincronizadas, ${res.errors.length} errores.`
        );
      })
      .catch((err) => {
        console.error('[Server] Error al sincronizar colecciones automáticas (inicio):', err);
      });

    cleanAbandonedCarts(14)
      .then((count) => {
        console.log(`[Server] Limpieza inicial de carritos completada: ${count} eliminados.`);
      })
      .catch((err) => {
        console.error('[Server] Error al limpiar carritos abandonados (inicio):', err);
      });

    // ─── Programación de tareas recurrentes cada 24 horas ─────────────────────
    setInterval(() => {
      console.log('[Server] Ejecutando tareas programadas diarias...');
      
      removeExpiredNovedadTags().catch((err) => {
        console.error('[Server] Error al remover etiquetas Novedad expiradas (intervalo):', err);
      });

      syncAllAutoCollections()
        .then((res) => {
          console.log(
            `[Server] Sincronización de colecciones automática completada (intervalo): ${res.synced} sincronizadas, ${res.errors.length} errores.`
          );
        })
        .catch((err) => {
          console.error('[Server] Error al sincronizar colecciones automáticas (intervalo):', err);
        });

      cleanAbandonedCarts(14)
        .then((count) => {
          console.log(`[Server] Limpieza periódica de carritos completada: ${count} eliminados.`);
        })
        .catch((err) => {
          console.error('[Server] Error al limpiar carritos abandonados (intervalo):', err);
        });
    }, 24 * 60 * 60 * 1000);
  });
}

bootstrap().catch((err) => {
  console.error('[Server] Error al iniciar:', err);
  process.exit(1);
});