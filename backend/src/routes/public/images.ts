/**
 * routes/public/images.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Sirve las imágenes desde la base de datos o redirige a Cloudflare R2.
 */

import { Router, Request, Response, NextFunction } from 'express';
import * as imgStorage from '../../services/imageStorageService';
import * as bannersCtrl from '../../controllers/public/bannersController';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';

const router = Router();

const CACHE = 'public, max-age=86400, stale-while-revalidate=3600';

// ─── Productos ─────────────────────────────────────────────────────────────────

router.get('/products/:id/thumb', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, mimeType, redirectUrl } = await imgStorage.serveProductImageThumb(req.params.id);
    
    if (redirectUrl) {
      return res.redirect(302, redirectUrl);
    }

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
    const { data, mimeType, redirectUrl } = await imgStorage.serveProductImage(req.params.id);
    
    if (redirectUrl) {
      return res.redirect(302, redirectUrl);
    }

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
    const { data, mimeType, redirectUrl } = await imgStorage.serveCategoryImageThumb(req.params.id);
    
    if (redirectUrl) {
      return res.redirect(302, redirectUrl);
    }

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
    const { data, mimeType, redirectUrl } = await imgStorage.serveCategoryImage(req.params.id);
    
    if (redirectUrl) {
      return res.redirect(302, redirectUrl);
    }

    res.set('Content-Type', mimeType);
    res.set('Cache-Control', CACHE);
    res.set('Content-Length', String(data.length));
    res.send(data);
  } catch (err) {
    next(err);
  }
});

// ─── Banners ───────────────────────────────────────────────────────────────────

router.get('/banners/:id/thumb', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const banner = await prisma.banner.findUnique({
      where: { id },
      select: { storageThumbKey: true }
    });

    if (banner?.storageThumbKey && env.R2_PUBLIC_URL) {
      return res.redirect(302, `${env.R2_PUBLIC_URL}/${banner.storageThumbKey}`);
    }

    return bannersCtrl.getBannerThumbnail(req, res, next);
  } catch (err) {
    next(err);
  }
});

router.get('/banners/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const banner = await prisma.banner.findUnique({
      where: { id },
      select: { storageKey: true }
    });

    if (banner?.storageKey && env.R2_PUBLIC_URL) {
      return res.redirect(302, `${env.R2_PUBLIC_URL}/${banner.storageKey}`);
    }

    return bannersCtrl.getBannerImage(req, res, next);
  } catch (err) {
    next(err);
  }
});

// ─── SKU images ────────────────────────────────────────────────────────────────

import * as skuPublic from '../../controllers/public/skuImagePublicController';

router.get('/sku/:id/thumb', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const skuImg = await prisma.productSkuImageStorage.findUnique({
      where: { id },
      select: { storageThumbKey: true }
    });

    if (skuImg?.storageThumbKey && env.R2_PUBLIC_URL) {
      return res.redirect(302, `${env.R2_PUBLIC_URL}/${skuImg.storageThumbKey}`);
    }

    return skuPublic.serveSkuImageThumb(req, res, next);
  } catch (err) {
    next(err);
  }
});

router.get('/sku/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const skuImg = await prisma.productSkuImageStorage.findUnique({
      where: { id },
      select: { storageKey: true }
    });

    if (skuImg?.storageKey && env.R2_PUBLIC_URL) {
      return res.redirect(302, `${env.R2_PUBLIC_URL}/${skuImg.storageKey}`);
    }

    return skuPublic.serveSkuImage(req, res, next);
  } catch (err) {
    next(err);
  }
});

export default router;