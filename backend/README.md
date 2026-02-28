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

