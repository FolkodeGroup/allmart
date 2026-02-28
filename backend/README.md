# Backend Allmart

Backend de Allmart construido con **Node.js + Express + TypeScript + Prisma + PostgreSQL**, diseñado con una arquitectura modular y escalable.

---

## Stack tecnológico

| Tecnología | Versión | Función |
|------------|---------|---------|
| Node.js | >= 18 | Runtime |
| Express | ^4.18 | Framework HTTP |
| TypeScript | ^5.4 | Tipado estático |
| Prisma ORM | ^7.4 | ORM y acceso a BD |
| @prisma/adapter-pg | ^7.4 | Driver adapter para PostgreSQL |
| PostgreSQL | >= 14 | Base de datos relacional |
| bcryptjs | ^3.0 | Hash de contraseñas |
| jsonwebtoken | ^9.0 | Autenticación JWT |
| dotenv | ^17.3 | Variables de entorno |

---

## Estructura de carpetas

```
backend/
├── prisma/
│   ├── schema.prisma          — Modelos Prisma (fuente de verdad del esquema)
│   └── migrations/            — Historial de migraciones Prisma
├── prisma.config.ts            — Configuración de Prisma CLI (datasource, migrations)
├── src/
│   ├── config/
│   │   ├── env.ts             — Variables de entorno centralizadas
│   │   ├── prisma.ts          — Singleton del Prisma Client (con adapter-pg)
│   │   └── database.ts        — Health check de conexión a BD
│   ├── types/
│   │   ├── index.ts           — Tipos globales (ApiResponse, JwtPayload, etc.)
│   │   ├── enums.ts           — Enumeraciones (UserRole, OrderStatus, etc.)
│   │   └── orders.ts          — DTOs públicos de pedidos
│   ├── models/
│   │   ├── User.ts            — Interfaz User + DTOs
│   │   ├── Category.ts        — Interfaz Category + DTOs
│   │   ├── Product.ts         — Interfaz Product + DTOs
│   │   ├── ProductVariant.ts  — Subdominio de productos
│   │   ├── ProductImage.ts    — Imágenes (almacenadas en JSONB)
│   │   └── Order.ts           — Interfaz Order + DTOs
│   ├── middlewares/
│   │   ├── auth.ts            — Verificación JWT
│   │   ├── permissions.ts     — Control de acceso por roles
│   │   └── errorHandler.ts    — Manejo global de errores
│   ├── utils/
│   │   ├── jwt.ts             — sign / verify
│   │   ├── bcrypt.ts          — hash / compare
│   │   └── response.ts        — sendSuccess / sendError / sendPaginated
│   ├── services/
│   │   ├── authService.ts          — Login admin/customer/registro (Prisma)
│   │   ├── categoriesService.ts    — CRUD categorías (Prisma)
│   │   ├── productsService.ts      — CRUD productos + filtros (Prisma)
│   │   ├── productVariantsService.ts — Variantes de producto (Prisma)
│   │   ├── productImagesService.ts   — Imágenes en JSONB (Prisma)
│   │   ├── ordersService.ts        — CRUD pedidos admin (Prisma)
│   │   ├── publicOrderService.ts   — Creación de pedidos pública (Prisma tx)
│   │   └── usersService.ts         — CRUD usuarios (Prisma)
│   ├── controllers/
│   │   ├── admin/             — Controladores del panel admin
│   │   └── public/            — Controladores del catálogo público
│   ├── routes/
│   │   ├── index.ts           — Router raíz que monta todos los dominios
│   │   ├── admin/             — Rutas protegidas (requieren JWT admin/editor)
│   │   └── public/            — Rutas públicas
│   ├── app.ts                 — Configuración Express
│   └── index.ts               — Punto de entrada del servidor
├── migrations/                — Migraciones SQL manuales (legacy, ya ejecutadas)
├── .env                       — Variables de entorno (no commitable)
└── .env.example               — Plantilla de variables de entorno
```

---

## Instalación y configuración

### Requisitos previos

- Node.js >= 18
- npm >= 9
- PostgreSQL >= 14 corriendo localmente o en la nube

### Pasos

```bash
# 1. Clonar el repositorio e ingresar al backend
cd backend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales (ver sección Variables de Entorno)

# 4. Crear la base de datos PostgreSQL (solo la primera vez)
sudo -u postgres psql -f scripts/create_db.sql
# Ver docs/DB_SETUP.md para instrucciones detalladas

# 5. Aplicar las migraciones SQL (crea las tablas en la BD)
npm run migrate

# 6. Generar el Prisma Client
npm run prisma:generate

# 7. Iniciar en modo desarrollo (hot-reload)
npm run dev
```

> El servidor queda disponible en **http://localhost:3001**

---

## Guía completa de base de datos y Prisma (paso a paso)

Esta sección explica desde cero cómo instalar PostgreSQL, crear la base de datos, aplicar las migraciones y configurar Prisma. Está pensada para personas sin experiencia previa con Prisma o PostgreSQL.

---

### 1. Instalar PostgreSQL

#### Linux (Ubuntu/Debian)

```bash
# Actualizar índices de paquetes
sudo apt update

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Verificar que el servicio está corriendo
sudo systemctl status postgresql
# Deberías ver: Active: active (running)

# Si no está corriendo, iniciarlo
sudo systemctl start postgresql
sudo systemctl enable postgresql  # Para que arranque automáticamente al iniciar el sistema
```

#### Windows

1. Descargar el instalador oficial desde: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
2. Elegir la versión **16.x** (o la más reciente estable).
3. Ejecutar el instalador y seguir el asistente:
   - Dejar los componentes predeterminados marcados (PostgreSQL Server, pgAdmin 4, Stack Builder, Command Line Tools).
   - Elegir el directorio de datos (dejar el predeterminado).
   - Definir una contraseña para el usuario `postgres`. **Anotarla, la necesitarás después.**
   - Puerto: `5432` (dejar predeterminado).
   - Locale: dejar predeterminado.
4. Finalizar la instalación.
5. Verificar que PostgreSQL está corriendo:
   - Abrir el menú inicio → buscar **Services** → buscar `postgresql-x64-16` → debería estar en estado "Running".
   - O desde PowerShell: `Get-Service -Name postgresql*`

> **Windows — Agregar PostgreSQL al PATH:**  
> Para poder usar `psql` desde la terminal sin indicar la ruta completa:  
> 1. Ir a **Panel de Control → Sistema → Configuración avanzada → Variables de entorno**.  
> 2. En "Variables del sistema", editar `Path`.  
> 3. Agregar: `C:\Program Files\PostgreSQL\16\bin` (ajustar según la versión instalada).  
> 4. Reiniciar la terminal.

---

### 2. Configurar el usuario de PostgreSQL

#### Linux

En Linux, PostgreSQL crea automáticamente un usuario del sistema llamado `postgres`. Para trabajar con él:

```bash
# Cambiar al usuario postgres del sistema
sudo -i -u postgres

# Abrir la consola de PostgreSQL
psql

# Dentro de psql, establecer una contraseña para el usuario postgres
\password postgres
# Ingresar la nueva contraseña (ej: 15211730) y confirmarla

# Salir de psql
\q

# Salir del usuario postgres del sistema
exit
```

#### Windows

Durante la instalación ya se definió la contraseña del usuario `postgres`. Para cambiarla:

```powershell
# Abrir PowerShell o CMD como administrador
psql -U postgres -h localhost
# Ingresar la contraseña definida durante la instalación

# Dentro de psql
\password postgres
# Ingresar nueva contraseña y confirmar

\q
```

---

### 3. Crear la base de datos

#### Linux

```bash
# Opción A: usando el script del proyecto (recomendada)
cd backend
psql -h localhost -U postgres -f scripts/create_db.sql
# Pedirá la contraseña del usuario postgres

# Opción B: manualmente
psql -h localhost -U postgres -c "CREATE DATABASE allmart_db;"
```

#### Windows (PowerShell o CMD)

```powershell
cd backend
psql -h localhost -U postgres -f scripts/create_db.sql
# Pedirá la contraseña del usuario postgres definida durante la instalación
```

> **Verificar que la base de datos fue creada:**
> ```bash
> psql -h localhost -U postgres -c "\l"
> # Deberías ver allmart_db en la lista
> ```

---

### 4. Configurar el archivo `.env`

Antes de aplicar las migraciones, el proyecto necesita conocer las credenciales de la base de datos.

```bash
# Desde la carpeta backend/
cp .env.example .env
```

Abrir `.env` con cualquier editor de texto y completar los valores:

```dotenv
NODE_ENV=development
PORT=3001
JWT_SECRET=cualquier_cadena_secreta_larga_y_segura

# PostgreSQL — usar los mismos datos con los que creaste la BD
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña_de_postgres
DB_NAME=allmart_db

# Prisma — esta URL se construye con los valores anteriores
# Formato: postgresql://USUARIO:CONTRASEÑA@HOST:PUERTO/NOMBRE_BD?schema=public
DATABASE_URL="postgresql://postgres:tu_contraseña_de_postgres@localhost:5432/allmart_db?schema=public"
```

> **Importante:** `DATABASE_URL` debe tener exactamente una sola línea con ese formato.  
> Si la contraseña tiene caracteres especiales como `@`, `#`, `%`, `/`, deberás codificarlos.  
> Por ejemplo: `@` → `%40`, `#` → `%23`, `%` → `%25`.

---

### 5. Instalar dependencias del proyecto

```bash
# Desde la carpeta backend/
npm install
```

Este comando descarga todas las dependencias incluyendo Prisma y su driver para PostgreSQL.

---

### 6. Aplicar las migraciones SQL (crear todas las tablas)

Las migraciones están en la carpeta `migrations/` y crean todas las tablas en orden.

```bash
# Desde la carpeta backend/
npm run migrate
```

Este comando ejecuta los archivos SQL del 001 al 009 en orden, creando:
- `users` — Usuarios del sistema
- `categories` — Categorías
- `products` — Productos
- `product_variants` — Variantes de productos
- `orders` + `order_items` — Pedidos
- `order_status_history` — Historial de estados
- `carts` + `cart_items` — Carritos
- `shipments` — Envíos
- `sales` — Ventas

> **Verificar que las tablas fueron creadas:**
> ```bash
> psql -h localhost -U postgres -d allmart_db -c "\dt"
> # Debe listar todas las tablas creadas
> ```

---

### 7. Generar el Prisma Client

Prisma genera automáticamente un cliente TypeScript a partir del archivo `prisma/schema.prisma`. Este cliente es el que usa el backend para hablar con la base de datos.

```bash
# Desde la carpeta backend/
npm run prisma:generate
```

Deberías ver:
```
✔ Generated Prisma Client (v7.4.2) to ./node_modules/@prisma/client
```

> **¿Cuándo volver a ejecutar este comando?**  
> Siempre que se modifique el archivo `prisma/schema.prisma`.

---

### 8. Iniciar el servidor

```bash
npm run dev
```

Deberías ver:
```
[DB] Conexión a PostgreSQL exitosa via Prisma Client
[Server] Escuchando en http://localhost:3001
```

---

### 9. Usar Prisma Studio (administración visual de la BD)

Prisma Studio es una interfaz web que permite ver y editar los datos de todas las tablas sin necesidad de escribir SQL.

```bash
npm run prisma:studio
# Abre http://localhost:5555 en el navegador
```

---

## Solución de errores comunes

### Error: `FATAL: Peer authentication failed for user "postgres"`

**Sistema:** Linux  
**Causa:** PostgreSQL en Linux intenta autenticar por "peer" (usuario del sistema), que no coincide cuando se usa `-h localhost`.  
**Solución:** Siempre usar `-h localhost` en los comandos psql para forzar autenticación TCP/IP con contraseña:
```bash
# ✗ Incorrecto (usa peer auth)
psql -U postgres

# ✓ Correcto (usa contraseña)
psql -h localhost -U postgres
```

---

### Error: `FATAL: password authentication failed for user "postgres"`

**Causa:** La contraseña ingresada no coincide con la configurada en PostgreSQL.  
**Solución:**
```bash
# Cambiar la contraseña del usuario postgres
sudo -u postgres psql -c "\password postgres"
# Ingresar la nueva contraseña

# Luego actualizar el .env con la misma contraseña
```

---

### Error: `ECONNREFUSED — connect ECONNREFUSED 127.0.0.1:5432`

**Causa:** PostgreSQL no está corriendo.  
**Solución Linux:**
```bash
sudo systemctl start postgresql
sudo systemctl status postgresql  # verificar que esté "active (running)"
```
**Solución Windows:**
```powershell
# PowerShell como administrador
Start-Service postgresql-x64-16   # ajustar nombre según versión
# O desde Servicios de Windows (services.msc)
```

---

### Error: `database "allmart_db" does not exist`

**Causa:** La base de datos no fue creada todavía.  
**Solución:**
```bash
psql -h localhost -U postgres -c "CREATE DATABASE allmart_db;"
```

---

### Error: `Authentication failed against database server, the provided database credentials for 'johndoe' are not valid`

**Causa:** El archivo `.env` tiene dos líneas `DATABASE_URL` y la segunda (el ejemplo de Prisma con `johndoe`) está sobreescribiendo la correcta.  
**Solución:** Abrir `.env` y eliminar la línea duplicada que contenga `johndoe:randompassword`. Dejar solo la que tiene tus credenciales reales.

---

### Error: `npm run migrate` falla con `psql: command not found`

**Causa:** `psql` no está en el PATH del sistema.  
**Solución Linux:**
```bash
sudo apt install -y postgresql-client
```
**Solución Windows:**  
Agregar `C:\Program Files\PostgreSQL\16\bin` al PATH de variables de entorno del sistema (ver sección de instalación).

---

### Error: `Cannot find module '@prisma/client'` o `Property 'user' does not exist on type 'PrismaClient'`

**Causa:** El Prisma Client no fue generado o está desactualizado.  
**Solución:**
```bash
npm run prisma:generate
```

---

### Error: `Error: listen EADDRINUSE: address already in use :::3001`

**Causa:** Ya hay otro proceso usando el puerto 3001.  
**Solución Linux:**
```bash
# Ver qué proceso usa el puerto 3001
lsof -i :3001
# Matar el proceso (reemplazar <PID> con el número que aparece)
kill -9 <PID>
```
**Solución Windows:**
```powershell
# Ver qué proceso usa el puerto 3001
netstat -ano | findstr :3001
# Matar el proceso (reemplazar <PID> con el número que aparece)
taskkill /PID <PID> /F
```

---

### El servidor arranca pero dice `Authentication failed` al hacer login

**Causa:** La contraseña del usuario `admin` en la base de datos no coincide con la que estás ingresando.  
**Solución:** Generar un nuevo hash y actualizar la base de datos:
```bash
# 1. Generar el hash de la nueva contraseña (ej: "admin")
node -e "require('bcryptjs').hash('admin', 10).then(console.log)"
# Copia el resultado, ej: $2b$10$xxxx...

# 2. Actualizar en la base de datos
psql -h localhost -U postgres -d allmart_db \
  -c "UPDATE users SET password_hash = '\$2b\$10\$xxxx...' WHERE email = 'admin';"
```

---

### Prisma Studio no muestra tablas

**Causa:** El Prisma Client no está sincronizado con la base de datos actual.  
**Solución:**
```bash
# Introspect la BD y actualizar schema.prisma
npm run prisma:pull

# Regenerar el cliente
npm run prisma:generate

# Reiniciar Prisma Studio
npm run prisma:studio
```

---

### Error en Windows: `'prisma' is not recognized as an internal or external command`

**Causa:** Prisma no está en el PATH porque `node_modules/.bin` no está accesible directamente.  
**Solución:** Usar siempre los scripts de `npm` definidos en `package.json` en lugar de llamar a `prisma` directamente:
```powershell
# ✗ No usar directamente
prisma generate

# ✓ Usar siempre vía npm
npm run prisma:generate
```

---

### Error en Windows: los scripts `.sh` no funcionan

**Causa:** Los archivos `start-backend.sh` y `start-frontend.sh` son scripts Bash, que no se ejecutan en CMD o PowerShell nativamente.  
**Solución:**
- Usar **Git Bash** (se instala con Git for Windows) para ejecutar scripts `.sh`.
- O usar **WSL** (Windows Subsystem for Linux).
- O ejecutar los comandos manualmente:
```powershell
# En vez de ./start-backend.sh, usar directamente:
cd backend
npm run dev
```

---

## Variables de entorno

Copiar `.env.example` → `.env` y completar los valores.

| Variable | Requerida | Default | Descripción |
|----------|-----------|---------|-------------|
| `NODE_ENV` | No | `development` | Entorno de ejecución |
| `PORT` | No | `3001` | Puerto del servidor Express |
| `CORS_ORIGIN` | No | `http://localhost:5173` | URL del frontend permitida |
| `JWT_SECRET` | **Sí** | — | Clave secreta para firma de JWT |
| `DB_HOST` | No | `localhost` | Host de PostgreSQL |
| `DB_PORT` | No | `5432` | Puerto de PostgreSQL |
| `DB_USER` | No | `postgres` | Usuario de PostgreSQL |
| `DB_PASSWORD` | **Sí** | — | Contraseña de PostgreSQL |
| `DB_NAME` | No | `allmart_db` | Nombre de la base de datos |
| `DATABASE_URL` | **Sí** | — | URL completa para Prisma (`postgresql://user:pw@host:port/db?schema=public`) |

### Ejemplo de `.env`

```dotenv
NODE_ENV=development
PORT=3001
JWT_SECRET=tu_clave_secreta_muy_segura

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=allmart_db

# Prisma (construida a partir de las variables anteriores)
DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/allmart_db?schema=public"
```

> Para generar un hash bcrypt de contraseña:
> ```bash
> node -e "require('bcryptjs').hash('tu_password', 10).then(console.log)"
> ```

---

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia con `ts-node-dev` y hot-reload |
| `npm run build` | Compila TypeScript → `dist/` |
| `npm start` | Inicia el servidor desde `dist/` (producción) |
| `npm run migrate` | Aplica migraciones SQL manuales a PostgreSQL |
| `npm run prisma:generate` | Regenera el Prisma Client a partir del schema |
| `npm run prisma:studio` | Abre Prisma Studio (administración visual de datos) |
| `npm run prisma:push` | Sincroniza el schema con la BD (sin generar migraciones) |
| `npm run prisma:pull` | Introspecta la BD y actualiza el schema.prisma |
| `npm run prisma:migrate` | Crea y aplica una migración de desarrollo |
| `npm run prisma:migrate:deploy` | Aplica migraciones en producción |
| `npm run seed` | Ejecuta el script de seed de datos iniciales |

---

## Prisma Studio — Administración Visual

Prisma Studio permite visualizar, crear, editar y eliminar registros de todas las tablas directamente desde el navegador.

```bash
# Asegurarse de que DATABASE_URL esté configurada en .env
npm run prisma:studio
# → Abre http://localhost:5555
```

> **Nota:** Prisma Studio usa la `DATABASE_URL` configurada en `prisma.config.ts` y el `.env`.

---

## Tabla de Endpoints

### Autenticación Admin

| Método | Ruta | Descripción | Auth | Ejemplo de respuesta |
|--------|------|-------------|------|----------------------|
| `POST` | `/api/admin/auth/login` | Login de admin/editor | No | `{ token, role, userId }` |

### Categorías (Admin)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/admin/categories` | Listar todas las categorías | Admin/Editor |
| `GET` | `/api/admin/categories/:id` | Obtener categoría por ID | Admin/Editor |
| `POST` | `/api/admin/categories` | Crear categoría | Admin |
| `PUT` | `/api/admin/categories/:id` | Actualizar categoría | Admin |
| `DELETE` | `/api/admin/categories/:id` | Eliminar categoría | Admin |

### Productos (Admin)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/admin/products` | Listar todos los productos | Admin/Editor |
| `GET` | `/api/admin/products/:id` | Obtener producto por ID | Admin/Editor |
| `POST` | `/api/admin/products` | Crear producto | Admin |
| `PUT` | `/api/admin/products/:id` | Actualizar producto | Admin |
| `DELETE` | `/api/admin/products/:id` | Eliminar producto | Admin |
| `GET` | `/api/admin/products/:id/variants` | Listar variantes | Admin/Editor |
| `POST` | `/api/admin/products/:id/variants` | Crear variante | Admin |
| `PUT` | `/api/admin/products/:id/variants/:vid` | Actualizar variante | Admin |
| `DELETE` | `/api/admin/products/:id/variants/:vid` | Eliminar variante | Admin |
| `GET` | `/api/admin/products/:id/images` | Listar imágenes | Admin/Editor |
| `POST` | `/api/admin/products/:id/images` | Agregar imagen | Admin |
| `PUT` | `/api/admin/products/:id/images/:iid` | Actualizar imagen | Admin |
| `DELETE` | `/api/admin/products/:id/images/:iid` | Eliminar imagen | Admin |

### Pedidos (Admin)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/admin/orders` | Listar todos los pedidos | Admin/Editor |
| `GET` | `/api/admin/orders/:id` | Obtener pedido por ID | Admin/Editor |
| `POST` | `/api/admin/orders` | Crear pedido | Admin/Editor |
| `PUT` | `/api/admin/orders/:id` | Actualizar pedido (estado, etc.) | Admin/Editor |
| `DELETE` | `/api/admin/orders/:id` | Eliminar pedido | Admin |

### Usuarios (Admin)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/admin/users` | Listar usuarios | Admin |
| `GET` | `/api/admin/users/:id` | Obtener usuario por ID | Admin |
| `POST` | `/api/admin/users` | Crear usuario | Admin |
| `DELETE` | `/api/admin/users/:id` | Eliminar usuario | Admin |

### Endpoints Públicos

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `POST` | `/api/auth/register` | Registro de cliente | No |
| `POST` | `/api/auth/login` | Login de cliente | No |
| `GET` | `/api/categories` | Listar categorías activas | No |
| `GET` | `/api/products` | Catálogo con filtros y paginación | No |
| `GET` | `/api/products/:slug` | Detalle de producto por slug | No |
| `POST` | `/api/orders` | Crear pedido público | No |

#### Filtros disponibles en `/api/products`

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `category` | string | Slug de categoría |
| `q` | string | Búsqueda de texto |
| `sort` | `price_asc` \| `price_desc` \| `rating` \| `newest` | Ordenamiento |
| `page` | number | Página (default: 1) |
| `limit` | number | Items por página (default: 12) |

---

## Ejemplo de respuesta exitosa

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "role": "admin",
    "userId": "f64c0caf-cac6-40d3-9722-394fdd47b66c"
  },
  "message": "Autenticación exitosa"
}
```

---

## Modelo de base de datos (Prisma Schema)

El archivo `prisma/schema.prisma` modela las siguientes entidades:

| Tabla | Descripción |
|-------|-------------|
| `users` | Usuarios del sistema (admin, editor, customer) |
| `categories` | Categorías de productos |
| `products` | Catálogo de productos con JSONB para imágenes/tags/features |
| `product_variants` | Variantes de producto (color, talle, etc.) en JSONB |
| `orders` | Pedidos de clientes |
| `order_items` | Items individuales de cada pedido |
| `order_status_history` | Historial de cambios de estado de pedidos |
| `carts` | Carritos de compra (autenticados y anónimos) |
| `cart_items` | Items del carrito |
| `shipments` | Envíos asociados a pedidos (1:1) |
| `sales` | Registro de ventas entregadas (para analítica) |

---

## Arquitectura de Prisma

```
prisma/schema.prisma          ← Definición del esquema
       ↓ npx prisma generate
node_modules/@prisma/client   ← Cliente generado
       ↓ import
src/config/prisma.ts          ← Singleton con adapter-pg
       ↓ import
src/services/*.ts             ← Servicios que usan el cliente
```

El `PrismaClient` en Prisma 7 requiere un **driver adapter** para conexión directa (`@prisma/adapter-pg`). La conexión se configura en `src/config/prisma.ts` y en `prisma.config.ts`.

---

## Filosofía y patrones

| Capa | Carpeta | Responsabilidad |
|------|---------|-----------------|
| Configuración | `src/config/` | Variables de entorno y singleton Prisma |
| Tipos globales | `src/types/` | Interfaces, enums y tipos compartidos |
| Modelos | `src/models/` | Contratos de datos por dominio |
| Lógica de negocio | `src/services/` | Reglas de negocio puras, usan Prisma |
| Presentación | `src/controllers/` | Adapta HTTP ↔ servicios |
| Rutas | `src/routes/` | Declaración de endpoints agrupados por dominio |
| Middlewares | `src/middlewares/` | Auth, permisos, manejo de errores |
| Helpers | `src/utils/` | Funciones reutilizables (JWT, bcrypt, response) |

> **Regla de oro:** los servicios nunca dependen de Express (sin `req`/`res`). Los controladores son delgados: sólo orquestan llamadas al servicio y devuelven la respuesta HTTP.

