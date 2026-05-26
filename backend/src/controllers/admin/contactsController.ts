/**
 * controllers/admin/contactsController.ts
 * Controlador administrativo para gestionar mensajes de contacto.
 */

import { Request, Response, NextFunction } from 'express';
import * as contactsService from '../../services/contactsService';
import { sendSuccess } from '../../utils/response';

// Obtener todos los contactos con paginación y filtros
export async function listContacts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = 1, limit = 20, status, isFlagged, search } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string) || 20));

    const contacts = await contactsService.listContacts({
      page: pageNum,
      limit: limitNum,
      status: (status as string) || undefined,
      isFlagged: isFlagged === 'true',
      search: (search as string) || undefined,
    });

    sendSuccess(res, contacts, 200, 'Contactos obtenidos exitosamente');
  } catch (err) {
    next(err);
  }
}

// Obtener un contacto específico por ID
export async function getContactById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, message: 'ID del contacto requerido' });
      return;
    }

    const contact = await contactsService.getContactById(id);

    if (!contact) {
      res.status(404).json({ success: false, message: 'Contacto no encontrado' });
      return;
    }

    sendSuccess(res, contact, 200);
  } catch (err) {
    next(err);
  }
}

// Actualizar estado de un contacto
export async function updateContactStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { status, isFlagged, adminNotes } = req.body as {
      status?: string;
      isFlagged?: boolean;
      adminNotes?: string;
    };

    if (!id) {
      res.status(400).json({ success: false, message: 'ID del contacto requerido' });
      return;
    }

    const contact = await contactsService.updateContact(id, {
      status,
      isFlagged,
      adminNotes,
    });

    if (!contact) {
      res.status(404).json({ success: false, message: 'Contacto no encontrado' });
      return;
    }

    sendSuccess(res, contact, 200, 'Contacto actualizado exitosamente');
  } catch (err) {
    next(err);
  }
}

// Marcar como leído (cambiar estado a "read")
export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, message: 'ID del contacto requerido' });
      return;
    }

    const contact = await contactsService.updateContact(id, { status: 'read' });

    if (!contact) {
      res.status(404).json({ success: false, message: 'Contacto no encontrado' });
      return;
    }

    sendSuccess(res, contact, 200, 'Contacto marcado como leído');
  } catch (err) {
    next(err);
  }
}

// Eliminar un contacto
export async function deleteContact(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, message: 'ID del contacto requerido' });
      return;
    }

    await contactsService.deleteContact(id);

    sendSuccess(res, { id }, 200, 'Contacto eliminado exitosamente');
  } catch (err) {
    next(err);
  }
}
