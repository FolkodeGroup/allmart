/**
 * routes/index.ts
 * Router raíz que monta todos los sub-routers de la API.
 * Para agregar un nuevo dominio:
 *   1. Crea src/routes/admin/miDominio.ts
 *   2. Importa y monta aquí: adminRouter.use('/mi-dominio', miDominioRouter)
 */

import { Router } from 'express';
import authRouter                from './admin/auth';
import productsRouter            from './admin/products';
import categoriesRouter          from './admin/categories';
import ordersRouter              from './admin/orders';
import usersRouter               from './admin/users';
import publicCategoriesRouter    from './public/categories';

const adminRouter = Router();

adminRouter.use('/auth',       authRouter);
adminRouter.use('/products',   productsRouter);
adminRouter.use('/categories', categoriesRouter);
adminRouter.use('/orders',     ordersRouter);
adminRouter.use('/users',      usersRouter);

// ─── Rutas públicas (sin autenticación) ───────────────────────────────────────
const publicRouter = Router();
publicRouter.use('/categories', publicCategoriesRouter);

// Router principal de la API
const apiRouter = Router();
apiRouter.use('/admin',  adminRouter);
apiRouter.use('/',       publicRouter);  // /api/categories, etc.

export default apiRouter;
