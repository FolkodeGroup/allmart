/**
 * routes/admin/contacts.ts
 * Rutas administrativas para gestionar contactos.
 * GET    /api/admin/contacts - Listar contactos
 * GET    /api/admin/contacts/:id - Obtener un contacto
 * PUT    /api/admin/contacts/:id - Actualizar un contacto
 * DELETE /api/admin/contacts/:id - Eliminar un contacto
 * POST   /api/admin/contacts/:id/mark-as-read - Marcar como leído
 */

import { Router } from 'express';
import {
  listContacts,
  getContactById,
  updateContactStatus,
  markAsRead,
  deleteContact,
} from '../../controllers/admin/contactsController';

const router = Router();

router.get('/', listContacts);
router.get('/:id', getContactById);
router.put('/:id', updateContactStatus);
router.post('/:id/mark-as-read', markAsRead);
router.delete('/:id', deleteContact);

export default router;
