/// <reference types="node" />
import "dotenv/config";
import { defineConfig } from "prisma/config";

// Extraer variables para armar la conexión en la VPS
const dbUser = process.env.DB_USER || "postgres";
const dbPass = process.env.DB_PASSWORD || "";
const dbHost = process.env.DB_HOST || "db";    // 'db' es el nombre del contenedor en la VPS
const dbPort = process.env.DB_PORT || "5432";  // 5432 es el puerto interno del contenedor DB
const dbName = process.env.DB_NAME || "allmart_db";

// Construir la URL dinámicamente si DATABASE_URL no existe
const databaseUrl = process.env.DATABASE_URL || `postgresql://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}?schema=public`;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});