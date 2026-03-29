/**
 * routes/admin/collections.ts
 * Rutas CRUD para administración de colecciones.
 */

import { Router } from 'express';
import * as controller from '../../controllers/admin/collectionsController';

const router = Router();

// GET /api/admin/collections - Listar colecciones con paginación
router.get('/', controller.index);

// GET /api/admin/collections/:id - Obtener colección específica
router.get('/:id', controller.show);

// POST /api/admin/collections - Crear nueva colección
router.post('/', controller.create);

// PUT /api/admin/collections/:id - Actualizar colección
router.put('/:id', controller.update);

// DELETE /api/admin/collections/:id - Eliminar colección
router.delete('/:id', controller.destroy);

// POST /api/admin/collections/:id/reorder - Reordenar productos en colección
router.post('/:id/reorder', controller.reorder);

// POST /api/admin/collections/:id/products - Agregar producto a colección
router.post('/:id/products', controller.addProduct);

// DELETE /api/admin/collections/:id/products/:productId - Eliminar producto de colección
router.delete('/:id/products/:productId', controller.removeProduct);

export default router;
