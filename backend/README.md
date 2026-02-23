# Backend Allmart — ERP-ready

Backend de Allmart construido con **Node.js + Express + TypeScript**, diseñado con una arquitectura modular y escalable orientada a evolucionar hacia un ERP completo.

---

## Filosofía de la estructura

La arquitectura sigue los principios de **Separación de Responsabilidades**, **Domain Driven Design (DDD)** y **Clean Architecture**:

| Capa | Carpeta | Responsabilidad |
|------|---------|-----------------|
| Configuración | `src/config/` | Variables de entorno y conexión a BD |
| Tipos globales | `src/types/` | Interfaces, enums y tipos compartidos |
| Modelos | `src/models/` | Contratos de datos por dominio |
| Lógica de negocio | `src/services/` | Reglas de negocio puras, sin Express |
| Presentación | `src/controllers/` | Adapta HTTP ↔ servicios |
| Rutas | `src/routes/` | Declaración de endpoints agrupados por dominio |
| Middlewares | `src/middlewares/` | Auth, permisos, manejo de errores |
| Helpers | `src/utils/` | Funciones reutilizables (JWT, bcrypt, response) |

> **Regla de oro:** los servicios nunca dependen de Express (sin `req`/`res`). Los controladores son delgados: sólo orquestan llamadas al servicio y devuelven la respuesta HTTP.

---

## Estructura de carpetas

```
backend/src/
├── config/
│   ├── env.ts             — Variables de entorno centralizadas
│   └── database.ts        — Conexión a BD (preparado para PostgreSQL/MongoDB)
├── types/
│   ├── index.ts           — Tipos globales (ApiResponse, JwtPayload, etc.)
│   └── enums.ts           — Enumeraciones globales (UserRole, OrderStatus, etc.)
├── models/
│   ├── User.ts
│   ├── Category.ts
│   ├── Product.ts
│   ├── ProductVariant.ts  — Subdominio de products
│   ├── ProductImage.ts    — Subdominio de products
│   ├── Order.ts
│   └── OrderItem.ts
├── middlewares/
│   ├── auth.ts            — Verificación JWT
│   ├── permissions.ts     — Control de acceso por roles
│   └── errorHandler.ts    — Manejo global de errores
├── utils/
│   ├── jwt.ts             — sign / verify
│   ├── bcrypt.ts          — hash / compare
│   └── response.ts        — sendSuccess / sendError / sendPaginated
├── services/
│   ├── authService.ts
│   ├── categoriesService.ts
│   ├── productsService.ts
│   ├── productVariantsService.ts
│   ├── productImagesService.ts
│   ├── ordersService.ts
│   └── usersService.ts
├── controllers/
│   └── admin/
│       ├── authController.ts
│       ├── categoriesController.ts
│       ├── productsController.ts
│       ├── productVariantsController.ts
│       ├── productImagesController.ts
│       ├── ordersController.ts
│       └── usersController.ts
├── routes/
│   ├── index.ts           — Router raíz que monta todos los dominios
│   └── admin/
│       ├── auth.ts
│       ├── categories.ts
│       ├── products.ts    — Monta subdominios /variants e /images
│       ├── products/
│       │   ├── variants.ts
│       │   └── images.ts
│       ├── orders.ts
│       └── users.ts
├── app.ts                 — Configuración Express (sin arranque)
└── index.ts               — Punto de entrada del servidor
```

---

## Cómo agregar un nuevo dominio

Ejemplo: agregar el dominio **Proveedores** (`suppliers`).

### 1. Modelo
```ts
// src/models/Supplier.ts
export interface Supplier { id: string; name: string; ... }
export type CreateSupplierDTO = Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>;
```

### 2. Servicio
```ts
// src/services/suppliersService.ts
export async function getAllSuppliers(): Promise<Supplier[]> { ... }
export async function createSupplier(dto: CreateSupplierDTO): Promise<Supplier> { ... }
```

### 3. Controlador
```ts
// src/controllers/admin/suppliersController.ts
export async function index(req, res, next) {
  const suppliers = await suppliersService.getAllSuppliers();
  sendSuccess(res, suppliers);
}
```

### 4. Rutas
```ts
// src/routes/admin/suppliers.ts
import { Router } from 'express';
import * as ctrl from '../../controllers/admin/suppliersController';
const router = Router();
router.get('/', ctrl.index);
export default router;
```

### 5. Montar en el router raíz
```ts
// src/routes/index.ts
import suppliersRouter from './admin/suppliers';
adminRouter.use('/suppliers', suppliersRouter);
```

---

## Cómo agregar un subdominio

Ejemplo: agregar **documentos** de proveedores.

1. Crear `src/models/SupplierDocument.ts`
2. Crear `src/services/supplierDocumentsService.ts`
3. Crear `src/controllers/admin/supplierDocumentsController.ts`
4. Crear `src/routes/admin/suppliers/documents.ts` con `Router({ mergeParams: true })`
5. Montar en `src/routes/admin/suppliers.ts`: `router.use('/:supplierId/documents', documentsRouter)`

---

## Instalación y ejecución

### Requisitos

- Node.js >= 18
- npm >= 9 (o pnpm / yarn)

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Completar DB_PASSWORD con el password del superusuario postgres

# 3. Crear la base de datos PostgreSQL (solo la primera vez)
sudo -u postgres psql -f scripts/create_db.sql
# Ver docs/DB_SETUP.md para instrucciones detalladas y troubleshooting

# 4. Iniciar en modo desarrollo (hot-reload)
npm run dev

# 5. O compilar y ejecutar en producción
npm run build
npm start
```

> El servidor queda disponible en **http://localhost:3001**

> Para resetear la base de datos en desarrollo: `sudo -u postgres psql -f scripts/drop_db.sql`

### Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia con `ts-node-dev` y hot-reload |
| `npm run build` | Compila TypeScript → `dist/` |
| `npm start` | Inicia el servidor desde `dist/` (producción) |

## Variables de entorno

Copiar `.env.example` → `.env` y completar los valores.
Todas las variables quedan centralizadas en `src/config/env.ts`.

| Variable | Requerida | Default | Descripción |
|----------|-----------|---------|-------------|
| `NODE_ENV` | No | `development` | Entorno de ejecución |
| `PORT` | No | `3001` | Puerto del servidor Express |
| `CORS_ORIGIN` | No | `http://localhost:5173` | URL del frontend permitida |
| `JWT_SECRET` | **Sí** | — | Clave secreta para firma de JWT |
| `ADMIN_USER` | No | `admin` | Nombre del usuario administrador |
| `ADMIN_HASH` | **Sí** | — | Hash bcrypt de la contraseña admin |
| `EDITOR_USER` | No | `editor` | Nombre del usuario editor |
| `EDITOR_HASH` | **Sí** | — | Hash bcrypt de la contraseña editor |
| `DB_HOST` | No | `localhost` | Host de PostgreSQL |
| `DB_PORT` | No | `5432` | Puerto de PostgreSQL |
| `DB_USER` | No | `postgres` | Superusuario de PostgreSQL |
| `DB_PASSWORD` | **Sí** | — | Password del superusuario postgres |
| `DB_NAME` | No | `allmart_db` | Nombre de la base de datos |

> Ver [docs/DB\_SETUP.md](docs/DB_SETUP.md) para instrucciones detalladas de configuración de PostgreSQL.

> Para generar un hash bcrypt:
> ```bash
> node -e "require('bcryptjs').hash('tu_password', 10).then(console.log)"
> ```

---

## Endopoints disponibles

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/admin/auth/login` | Login admin |
| GET | `/api/admin/products` | Listar productos |
| POST | `/api/admin/products` | Crear producto |
| GET | `/api/admin/products/:id/variants` | Variantes de producto |
| GET | `/api/admin/products/:id/images` | Imágenes de producto |
| GET | `/api/admin/categories` | Listar categorías |
| GET | `/api/admin/orders` | Listar pedidos |
| GET | `/api/admin/users` | Listar usuarios (solo admin) |
