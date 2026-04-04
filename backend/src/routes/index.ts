/**
 * routes/index.ts
 * Router raíz que monta todos los sub-routers de la API.
 * Para agregar un nuevo dominio:
 *   1. Crea src/routes/admin/miDominio.ts
 *   2. Importa y monta aquí: adminRouter.use('/mi-dominio', miDominioRouter)
 */

import { Router } from 'express';
import authRouter from './admin/auth';
import productsRouter from './admin/products';
import categoriesRouter from './admin/categories';
import ordersRouter from './admin/orders';
import usersRouter from './admin/users';
import staffNotesRouter from './admin/staffNotes';
import promotionsRouter from './admin/promotions';
import collectionsRouter from './admin/collections';
import lowStockAlertsRouter from './admin/lowStockAlerts';
import bannersRouter from './admin/banners';
import publicCategoriesRouter from './public/categories';
import publicProductsRouter from './public/products';
import publicAuthRouter from './public/auth';
import publicOrdersRouter from './public/orders';
import publicCartRouter from './public/cart';
import publicImagesRouter from './public/images';
import publicCollectionsRouter from './public/collections';
import publicPromotionsRouter from './public/promotions';
import publicBannersRouter from './public/banners';
import { adminMiddleware } from '../middlewares/auth';

const adminRouter = Router();

// Rutas públicas dentro de /admin
adminRouter.use('/auth', authRouter);

// A partir de aquí, todas las rutas requieren autenticación y rol de admin o editor
adminRouter.use(adminMiddleware);

adminRouter.use('/products', productsRouter);
adminRouter.use('/categories', categoriesRouter);
adminRouter.use('/orders', ordersRouter);
adminRouter.use('/users', usersRouter);
adminRouter.use('/staff-notes', staffNotesRouter);
adminRouter.use('/promotions', promotionsRouter);
adminRouter.use('/collections', collectionsRouter);
adminRouter.use('/low-stock-alerts', lowStockAlertsRouter);
adminRouter.use('/banners', bannersRouter);

// ─── Rutas públicas (sin autenticación) ───────────────────────────────────────
const publicRouter = Router();
publicRouter.use('/auth', publicAuthRouter);
publicRouter.use('/categories', publicCategoriesRouter);
publicRouter.use('/products', publicProductsRouter);
publicRouter.use('/orders', publicOrdersRouter);
publicRouter.use('/cart', publicCartRouter);
publicRouter.use('/images', publicImagesRouter);
publicRouter.use('/collections', publicCollectionsRouter);
publicRouter.use('/promotions', publicPromotionsRouter);
publicRouter.use('/banners', publicBannersRouter);

// Router principal de la API
const apiRouter = Router();
apiRouter.use('/admin', adminRouter);
apiRouter.use('/', publicRouter);  // /api/categories, etc.

export default apiRouter;
