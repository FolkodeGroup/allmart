/**
 * backend/src/controllers/public/contactsController.ts
 */

import { Request, Response, NextFunction } from 'express';
import * as contactsService from '../../services/contactsService';
import { sendSuccess } from '../../utils/response';

export async function submitContactForm(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, phone, message } = req.body as {
      name?: string;
      email?: string;
      phone?: string;
      message?: string;
    };

    if (!name || !email || !message) {
      res.status(400).json({ success: false, message: 'Nombre, email y mensaje son requeridos' });
      return;
    }

    if (name.trim().length < 2) {
      res.status(400).json({ success: false, message: 'El nombre debe tener al menos 2 caracteres' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, message: 'El formato del email no es válido' });
      return;
    }

    if (message.trim().length < 10) {
      res.status(400).json({ success: false, message: 'El mensaje debe tener al menos 10 caracteres' });
      return;
    }

    const contact = await contactsService.createContact({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      message: message.trim(),
    });

    sendSuccess(res, contact, 201, 'Mensaje enviado exitosamente. Nos pondremos en contacto pronto.');
  } catch (err) {
    next(err);
  }
}

// NUEVO: Controlador para el botón de arrepentimiento
export async function submitWithdrawalForm(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { fullName, email, orderNumber, purchaseDate, reason } = req.body;

    // 1. Validaciones estrictas en el backend
    if (!fullName || !email || !orderNumber || !purchaseDate) {
      res.status(400).json({ success: false, message: 'Faltan campos obligatorios (Nombre, Email, Pedido, Fecha)' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, message: 'El formato del email no es válido' });
      return;
    }

    const parsedDate = new Date(purchaseDate);
    if (isNaN(parsedDate.getTime()) || parsedDate > new Date()) {
      res.status(400).json({ success: false, message: 'La fecha de compra es inválida o futura' });
      return;
    }

    // 2. Formateamos la data para guardarla en la tabla genérica de Contactos
    // Esto te salva de tener que hacer una migración en Prisma ahora mismo.
    const formattedMessage = `[SOLICITUD DE ARREPENTIMIENTO]
Pedido: ${orderNumber.trim()}
Fecha de compra: ${purchaseDate}
Motivo: ${reason ? reason.trim() : 'No especificado'}`;

    const contact = await contactsService.createContact({
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: null,
      message: formattedMessage,
    });

    // 3. Generamos un código de tracking real basado en el ID de la base de datos
    // Asumiendo que tu ID es un UUID, tomamos el primer bloque.
    const trackingCode = `ARREP-${contact.id.split('-')[0].toUpperCase()}`;

    sendSuccess(res, { contact, trackingCode }, 201, 'Solicitud de arrepentimiento registrada.');
  } catch (err) {
    next(err);
  }
}