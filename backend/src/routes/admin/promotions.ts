/**
 * routes/admin/promotions.ts
 * Rutas CRUD para administración de promociones.
 */

import { Router } from 'express';
import * as controller from '../../controllers/admin/promotionsController';

const router = Router();

// GET /api/admin/promotions - Listar promociones con paginación
router.get('/', controller.index);

// GET /api/admin/promotions/:id - Obtener promoción específica
router.get('/:id', controller.show);

// POST /api/admin/promotions - Crear nueva promoción
router.post('/', controller.create);

// PUT /api/admin/promotions/:id - Actualizar promoción
router.put('/:id', controller.update);

// DELETE /api/admin/promotions/:id - Eliminar promoción
router.delete('/:id', controller.destroy);

// POST /api/admin/promotions/:id/duplicate - Duplicar promoción
router.post('/:id/duplicate', controller.duplicate);

export default router;
