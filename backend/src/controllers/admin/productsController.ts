/**
 * controllers/admin/productsController.ts
 * Controlador CRUD para el dominio de productos con Auditoría integrada.
 */

import { isAbsolute, resolve } from 'node:path';
import { Response, NextFunction } from 'express';
import * as productsService from '../../services/productsService';
import * as auditService from '../../services/auditService';
import {
  CatalogPdfProductInput,
  generateCatalogPdf,
} from '../../services/catalogPdfService';
import { createError } from '../../middlewares/errorHandler';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';
import { CreateProductDTO, UpdateProductDTO } from '../../models/Product';

type CatalogExportRequestBody = {
  products?: CatalogPdfProductInput[];
  productIds?: string[];
  filters?: {
    q?: string;
    categoryId?: string;
    status?: string;
    stockLevel?: string;
    limit?: number;
  };
  paperFormat?: 'A4' | 'Letter';
  columns?: 2 | 3;
  title?: string;
  subtitle?: string;
  locale?: string;
  defaultCurrency?: string;
  contactText?: string;
  savePath?: string;
};

function buildBaseUrl(req: AuthenticatedRequest): string {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const forwardedHost = req.headers['x-forwarded-host'];
  const protocol = typeof forwardedProto === 'string'
    ? forwardedProto.split(',')[0].trim()
    : req.protocol;
  const host = typeof forwardedHost === 'string'
    ? forwardedHost.split(',')[0].trim()
    : req.get('host');

  if (!host) {
    throw createError('No se pudo resolver el host para generar el catalogo', 500);
  }

  return `${protocol}://${host}`;
}

function mapProductToCatalogInput(product: Awaited<ReturnType<typeof productsService.getProductsForCatalogExport>>[number]): CatalogPdfProductInput {
  return {
    id: product.id,
    title: product.name,
    price: product.price,
    shortDescription: product.shortDescription ?? product.description ?? '',
    imageUrl: product.images[0],
  };
}

function resolveCatalogSavePath(savePath?: string): string | undefined {
  if (!savePath) {
    return undefined;
  }

  if (isAbsolute(savePath)) {
    throw createError('savePath debe ser relativo al directorio de exportacion configurado', 400);
  }

  const baseDirectory = resolve(process.env.CATALOG_PDF_OUTPUT_DIR ?? `${process.cwd()}/test-results/catalog-exports`);
  const resolvedPath = resolve(baseDirectory, savePath);

  if (!resolvedPath.startsWith(`${baseDirectory}/`) && resolvedPath !== baseDirectory) {
    throw createError('savePath contiene una ruta no permitida', 400);
  }

  return resolvedPath;
}

export async function index(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { q, categoryId, status, stockLevel, page, limit } = req.query;
    const result = await productsService.getAdminProducts({
      q: q as string,
      categoryId: categoryId as string,
      status: status as string,
      stockLevel: stockLevel as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function show(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await productsService.getProductById(req.params.id);
    sendSuccess(res, product);
  } catch (err) { next(err); }
}

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await productsService.createProduct(req.body as CreateProductDTO);

    await auditService.recordAction({
      userEmail: req.user?.user || 'desconocido',
      action: 'crear',
      entity: 'products',
      entityId: product.id,
      details: { name: product.name }
    });

    sendSuccess(res, product, 201, 'Producto creado');
  } catch (err) { next(err); }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await productsService.updateProduct(req.params.id, req.body as UpdateProductDTO);

    await auditService.recordAction({
      userEmail: req.user?.user || 'desconocido',
      action: 'editar',
      entity: 'products',
      entityId: product.id,
      details: { name: product.name }
    });

    sendSuccess(res, product, 200, 'Producto actualizado');
  } catch (err) { next(err); }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await productsService.getProductById(req.params.id);
    await productsService.deleteProduct(req.params.id);

    await auditService.recordAction({
      userEmail: req.user?.user || 'desconocido',
      action: 'eliminar',
      entity: 'products',
      entityId: req.params.id,
      details: { name: product.name }
    });

    sendSuccess(res, null, 200, 'Producto eliminado');
  } catch (err) { next(err); }
}

export async function lowStockCount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const count = await productsService.getLowStockCount();
    sendSuccess(res, { count });
  } catch (err) { next(err); }
}

export async function priceHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const history = await productsService.getProductPriceHistory(req.params.id);
    sendSuccess(res, history);
  } catch (err) { next(err); }
}

export async function exportCatalogPdf(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = (req.body ?? {}) as CatalogExportRequestBody;
    const filters = body.filters ?? {};

    const inputProducts = Array.isArray(body.products) && body.products.length > 0
      ? body.products
      : (await productsService.getProductsForCatalogExport({
        q: filters.q,
        categoryId: filters.categoryId,
        status: filters.status,
        stockLevel: filters.stockLevel,
        productIds: body.productIds,
        limit: filters.limit,
      })).map(mapProductToCatalogInput);

    if (inputProducts.length === 0) {
      throw createError('No se encontraron productos para exportar', 404);
    }

    const { buffer, fileName } = await generateCatalogPdf({
      products: inputProducts,
      baseUrl: buildBaseUrl(req),
      paperFormat: body.paperFormat,
      columns: body.columns,
      title: body.title,
      subtitle: body.subtitle,
      locale: body.locale,
      defaultCurrency: body.defaultCurrency,
      contactText: body.contactText,
      savePath: resolveCatalogSavePath(body.savePath),
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length.toString());
    res.status(200).send(buffer);
  } catch (err) {
    next(err);
  }
}