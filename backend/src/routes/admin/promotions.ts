/**
 * routes/admin/promotions.ts
 * Rutas CRUD para administración de promociones.
 */

import { Router } from 'express';
import * as controller from '../../controllers/admin/promotionsController';

const router = Router();

// GET /api/admin/promotions/matrix - Resumen de matriz (antes del /:id para no colisionar)
router.get('/matrix', controller.matrix);

// GET /api/admin/promotions - Listar promociones con paginación
router.get('/', controller.index);

// GET /api/admin/promotions/:id - Obtener promoción específica
router.get('/:id', controller.show);

// GET /api/admin/promotions/:id/products - Productos asignados a la promoción
router.get('/:id/products', controller.getProducts);

// POST /api/admin/promotions - Crear nueva promoción
router.post('/', controller.create);

// POST /api/admin/promotions/:id/assign - Asignar/desasignar productos en bloque
router.post('/:id/assign', controller.assignProducts);

// POST /api/admin/promotions/:id/duplicate - Duplicar promoción
router.post('/:id/duplicate', controller.duplicate);

// PUT /api/admin/promotions/:id - Actualizar promoción
router.put('/:id', controller.update);

// DELETE /api/admin/promotions/:id - Eliminar promoción
router.delete('/:id', controller.destroy);

export default router;
