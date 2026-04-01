/**
 * routes/public/images.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Sirve las imágenes binarias almacenadas en la base de datos.
 * No requiere autenticación.
 *
 * Rutas:
 *   GET /api/images/products/:id        → imagen WebP completa de producto
 *   GET /api/images/products/:id/thumb  → miniatura WebP de producto
 *   GET /api/images/categories/:id      → imagen WebP completa de categoría
 *   GET /api/images/categories/:id/thumb → miniatura WebP de categoría
 *
 * Headers:
 *   Content-Type: image/webp
 *   Cache-Control: public, max-age=86400 (24 h)
 */

import { Router, Request, Response, NextFunction } from 'express';
import * as imgStorage from '../../services/imageStorageService';
import * as bannersCtrl from '../../controllers/public/bannersController';

const router = Router();

const CACHE = 'public, max-age=86400, stale-while-revalidate=3600';

// ─── Productos ─────────────────────────────────────────────────────────────────

router.get('/products/:id/thumb', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, mimeType } = await imgStorage.serveProductImageThumb(req.params.id);
    res.set('Content-Type', mimeType);
    res.set('Cache-Control', CACHE);
    res.set('Content-Length', String(data.length));
    res.send(data);
  } catch (err) {
    next(err);
  }
});

router.get('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, mimeType } = await imgStorage.serveProductImage(req.params.id);
    res.set('Content-Type', mimeType);
    res.set('Cache-Control', CACHE);
    res.set('Content-Length', String(data.length));
    res.send(data);
  } catch (err) {
    next(err);
  }
});

// ─── Categorías ────────────────────────────────────────────────────────────────

router.get('/categories/:id/thumb', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, mimeType } = await imgStorage.serveCategoryImageThumb(req.params.id);
    res.set('Content-Type', mimeType);
    res.set('Cache-Control', CACHE);
    res.set('Content-Length', String(data.length));
    res.send(data);
  } catch (err) {
    next(err);
  }
});

router.get('/categories/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, mimeType } = await imgStorage.serveCategoryImage(req.params.id);
    res.set('Content-Type', mimeType);
    res.set('Cache-Control', CACHE);
    res.set('Content-Length', String(data.length));
    res.send(data);
  } catch (err) {
    next(err);
  }
});

// ─── Banners ───────────────────────────────────────────────────────────────────

router.get('/banners/:id/thumb', bannersCtrl.getBannerThumbnail);
router.get('/banners/:id', bannersCtrl.getBannerImage);

export default router;
