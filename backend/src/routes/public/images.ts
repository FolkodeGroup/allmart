/**
 * routes/public/images.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Sirve las imágenes desde la base de datos o redirige a Cloudflare R2.
 * Si la imagen original o miniatura no existe, sirve un placeholder SVG elegante.
 */

import { Router, Request, Response, NextFunction } from 'express';
import * as imgStorage from '../../services/imageStorageService';
import * as bannersCtrl from '../../controllers/public/bannersController';
import * as skuPublic from '../../controllers/public/skuImagePublicController';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';

const router = Router();

const CACHE = 'public, max-age=86400, stale-while-revalidate=3600';

// ─── PLACEHOLDER SVG fallback ──────────────────────────────────────────────────

const PLACEHOLDER_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240" fill="none">
    <rect width="240" height="240" fill="#F3F4F6"/>
    <g opacity="0.35">
      <path d="M120 75C100.67 75 85 90.67 85 110C85 129.33 100.67 145 120 145C139.33 145 155 129.33 155 110C155 90.67 139.33 75 120 75ZM120 131C108.4 131 99 121.6 99 110C99 98.4 108.4 89 120 89C131.6 89 141 98.4 141 110C141 121.6 131.6 131 120 131Z" fill="#9CA3AF"/>
      <path d="M152 143H88C83.58 143 80 146.58 80 151V165H160V151C160 146.58 156.42 143 152 143Z" fill="#9CA3AF"/>
    </g>
  </svg>
`.trim();

function servePlaceholder(res: Response) {
  return res
    .status(200) // 200 previene alertas rojas de red fallida en consola de navegador
    .set('Content-Type', 'image/svg+xml')
    .set('Cache-Control', CACHE)
    .send(Buffer.from(PLACEHOLDER_SVG));
}

// ─── PRODUCTOS ─────────────────────────────────────────────────────────────────

router.get('/products/:id/thumb', async (req: Request, res: Response) => {
  try {
    const { data, mimeType, redirectUrl } = await imgStorage.serveProductImageThumb(req.params.id);
    
    if (redirectUrl) return res.redirect(302, redirectUrl);

    if (data && data.length > 0) {
      return res.set('Content-Type', mimeType).set('Cache-Control', CACHE).set('Content-Length', String(data.length)).send(data);
    }
    
    return servePlaceholder(res);
  } catch { 
    return servePlaceholder(res); 
  }
});

router.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const { data, mimeType, redirectUrl } = await imgStorage.serveProductImage(req.params.id);
    
    if (redirectUrl) return res.redirect(302, redirectUrl);

    if (data && data.length > 0) {
      return res.set('Content-Type', mimeType).set('Cache-Control', CACHE).set('Content-Length', String(data.length)).send(data);
    }
    
    return servePlaceholder(res);
  } catch { 
    return servePlaceholder(res); 
  }
});

// ─── CATEGORÍAS ────────────────────────────────────────────────────────────────

router.get('/categories/:id/thumb', async (req: Request, res: Response) => {
  try {
    const { data, mimeType, redirectUrl } = await imgStorage.serveCategoryImageThumb(req.params.id);
    if (redirectUrl) return res.redirect(302, redirectUrl);

    if (data && data.length > 0) {
      return res.set('Content-Type', mimeType).set('Cache-Control', CACHE).send(data);
    }
    return servePlaceholder(res);
  } catch { 
    return servePlaceholder(res); 
  }
});

router.get('/categories/:id', async (req: Request, res: Response) => {
  try {
    const { data, mimeType, redirectUrl } = await imgStorage.serveCategoryImage(req.params.id);
    if (redirectUrl) return res.redirect(302, redirectUrl);

    if (data && data.length > 0) {
      return res.set('Content-Type', mimeType).set('Cache-Control', CACHE).send(data);
    }
    return servePlaceholder(res);
  } catch { 
    return servePlaceholder(res); 
  }
});

// ─── BANNERS ───────────────────────────────────────────────────────────────────

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
  } catch { 
    return servePlaceholder(res); 
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
  } catch { 
    return servePlaceholder(res); 
  }
});

// ─── SKUS (VARIANTES) ──────────────────────────────────────────────────────────

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
  } catch { 
    return servePlaceholder(res); 
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
  } catch { 
    return servePlaceholder(res); 
  }
});

export default router;