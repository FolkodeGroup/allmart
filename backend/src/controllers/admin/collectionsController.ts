/**
 * controllers/admin/collectionsController.ts
 * Controlador CRUD para el dominio de colecciones.
 */

import { Response, NextFunction } from 'express';
import * as collectionsService from '../../services/collectionsService';
import { syncAutoCollection, syncAllAutoCollections } from '../../jobs/collectionsJob';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';
import { CreateCollectionDTO, UpdateCollectionDTO } from '../../services/collectionsService';

export async function getAll(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const collections = await collectionsService.getAllCollectionsUnpaginated();
    sendSuccess(res, collections);
  } catch (err) {
    next(err);
  }
}

export async function index(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { q, isActive, displayPosition, page, limit } = req.query;

    const pageNum = page ? Math.max(1, parseInt(page as string, 10)) : 1;
    const limitNum = limit ? Math.max(1, Math.min(100, parseInt(limit as string, 10))) : 10;

    const filters: any = {};
    if (q) filters.search = q as string;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (displayPosition) filters.displayPosition = displayPosition as string;

    const result = await collectionsService.getAllCollections(
      (pageNum - 1) * limitNum,
      limitNum,
      filters
    );

    sendSuccess(res, {
      data: result.data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        pages: Math.ceil(result.total / limitNum),
      },
    } as any);
  } catch (err) {
    next(err);
  }
}

export async function show(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const collection = await collectionsService.getCollectionById(req.params.id);
    sendSuccess(res, collection);
  } catch (err) {
    next(err);
  }
}

export async function create(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const collection = await collectionsService.createCollection(req.body as CreateCollectionDTO);
    sendSuccess(res, collection, 201, 'Colección creada');
  } catch (err) {
    next(err);
  }
}

export async function update(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const collection = await collectionsService.updateCollection(
      req.params.id,
      req.body as UpdateCollectionDTO
    );
    sendSuccess(res, collection, 200, 'Colección actualizada');
  } catch (err) {
    next(err);
  }
}

export async function destroy(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await collectionsService.deleteCollection(req.params.id);
    sendSuccess(res, null, 200, 'Colección eliminada');
  } catch (err) {
    next(err);
  }
}

export async function reorder(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { productOrder } = req.body;
    if (!Array.isArray(productOrder)) {
      return sendSuccess(
        res,
        null,
        400,
        'productOrder debe ser un array de IDs de productos'
      );
    }

    await collectionsService.reorderCollectionItems(req.params.id, productOrder);
    sendSuccess(res, null, 200, 'Orden de productos actualizado');
  } catch (err) {
    next(err);
  }
}

export async function addProduct(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { productId } = req.body;
    if (!productId) {
      return sendSuccess(res, null, 400, 'productId es requerido');
    }

    await collectionsService.addProductToCollection(req.params.id, productId);
    const collection = await collectionsService.getCollectionById(req.params.id);
    sendSuccess(res, collection, 200, 'Producto agregado a la colección');
  } catch (err) {
    next(err);
  }
}

export async function removeProduct(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { productId } = req.params;
    if (!productId) {
      return sendSuccess(res, null, 400, 'productId es requerido');
    }

    await collectionsService.removeProductFromCollection(req.params.id, productId);
    const collection = await collectionsService.getCollectionById(req.params.id);
    sendSuccess(res, collection, 200, 'Producto eliminado de la colección');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/collections/:id/sync
 * Sincroniza manualmente una colección auto_sales con el top de ventas actual.
 */
export async function syncCollection(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await syncAutoCollection(req.params.id);
    const collection = await collectionsService.getCollectionById(req.params.id);
    sendSuccess(res, collection, 200, 'Colección sincronizada con top ventas');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/collections/sync-all
 * Sincroniza todas las colecciones auto_sales activas de una vez.
 */
export async function syncAllCollections(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await syncAllAutoCollections();
    sendSuccess(res, result, 200, `Sincronizadas ${result.synced} colecciones`);
  } catch (err) {
    next(err);
  }
}
