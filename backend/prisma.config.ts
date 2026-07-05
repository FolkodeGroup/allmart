/// <reference types="node" />
import "dotenv/config";
import { defineConfig } from "prisma/config";

// Extraer las variables individuales (las mismas que usa el backend)
const dbUser = process.env.DB_USER || "postgres";
const dbPass = process.env.DB_PASSWORD || "";
const dbHost = process.env.DB_HOST || "db";
const dbPort = process.env.DB_PORT || "5432";
const dbName = process.env.DB_NAME || "allmart_db";

// Construir la URL de conexión de forma dinámica garantizada
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