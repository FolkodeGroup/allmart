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

## Scripts

```bash
npm install          # Instala dependencias
npm run dev          # Modo desarrollo con hot-reload (ts-node-dev)
npm run build        # Compila TypeScript → dist/
npm start            # Inicia desde dist/ (producción)
```

## Requisitos

- Node.js >= 18
- TypeScript >= 5

## Variables de entorno

Ver `.env` en la raíz del backend. Variables disponibles en `src/config/env.ts`.

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
