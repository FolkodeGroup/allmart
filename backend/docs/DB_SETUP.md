# Configuración de la base de datos PostgreSQL — Allmart

> **Estrategia de acceso:** Allmart usa el superusuario `postgres` para no interferir con otros proyectos del mismo equipo. No se crea un rol adicional.

---

## Requisitos previos

- PostgreSQL >= 14 instalado y en ejecución
- Acceso al superusuario `postgres` (con su password)

---

## 1. Crear la base de datos

> **Nota:** En Linux, el superusuario `postgres` usa autenticación `peer` por defecto, por lo que se debe invocar con `sudo -u postgres`.

Ejecuta el script desde la raíz del backend:

```bash
sudo -u postgres psql -f scripts/create_db.sql
```

El script realiza las siguientes acciones:

| Acción | Detalle |
|--------|---------|
| Crea la base de datos | `allmart_db` (solo si no existe) |
| Instala extensiones | `uuid-ossp` (UUIDs) y `pgcrypto` (cripto) |

---

## 2. Configurar las variables de entorno

Copia `.env.example` a `.env` y completa el password de `postgres`:

```bash
cp .env.example .env
```

Edita el archivo `.env`:

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password_de_postgres   # ← completar
DB_NAME=allmart_db
```

> Si el usuario `postgres` no tiene contraseña configurada para conexiones TCP, establécela con:
> ```bash
> sudo -u postgres psql -c "ALTER ROLE postgres WITH PASSWORD 'tu_password';"
> ```
> Luego verifica la conexión TCP antes de arrancar el servidor:
> ```bash
> PGPASSWORD=tu_password psql -h localhost -U postgres -d allmart_db -c "SELECT NOW();"
> ```

---

## 3. Verificar la conexión

Una vez configurado el `.env`, inicia el servidor:

```bash
npm run dev
```

Si la conexión es exitosa verás en consola:

```
[DB] Conexión a PostgreSQL exitosa — servidor: 2026-02-23T...
[Server] Escuchando en http://localhost:3001
```

Si falla, verás:

```
[DB] No se pudo conectar a PostgreSQL: <motivo del error>
```

Causas frecuentes:

| Error | Solución |
|-------|----------|
| `password authentication failed` | Revisar `DB_PASSWORD` en `.env` |
| `database "allmart_db" does not exist` | Ejecutar `scripts/create_db.sql` |
| `Connection refused` | Verificar que PostgreSQL está corriendo: `pg_isready` |

---

## 4. Eliminar la base de datos (solo testing / reset)

⚠️ **Elimina todos los datos. Solo usar en entornos de desarrollo.**

```bash
sudo -u postgres psql -f scripts/drop_db.sql
```

---

## Variables de entorno de base de datos

| Variable | Default | Descripción |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | Host del servidor PostgreSQL |
| `DB_PORT` | `5432` | Puerto de PostgreSQL |
| `DB_USER` | `postgres` | Usuario (superusuario) |
| `DB_PASSWORD` | — | Password del usuario (requerido) |
| `DB_NAME` | `allmart_db` | Nombre de la base de datos |

---

## Arquitectura del pool de conexiones

```
index.ts → connectDB()     (database.ts)  — verifica la conexión al arranque
                └─ pool.connect()  (db.ts) — Pool singleton (max 10 conexiones)
                      └─ env.ts            — lee las variables de entorno
```

El `pool` se importa directamente en servicios y repositorios:

```ts
import { pool } from '../config/db';
const { rows } = await pool.query('SELECT * FROM products');
```
