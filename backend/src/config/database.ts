/**
 * config/database.ts
 * Punto de conexión a la base de datos.
 * Actualmente el sistema usa datos en memoria; cuando se integre
 * una BD (PostgreSQL, MongoDB, etc.) la lógica de conexión va aquí.
 *
 * Ejemplo con PostgreSQL (pg / prisma / typeorm):
 *   export const db = new Pool({ connectionString: env.DATABASE_URL });
 *
 * Ejemplo con MongoDB (mongoose):
 *   export const connectDB = async () => mongoose.connect(env.DATABASE_URL);
 */

export const connectDB = async (): Promise<void> => {
  // TODO: implementar conexión cuando se elija la BD
  console.log('[DB] Base de datos en modo in-memory (sin conexión externa)');
};
