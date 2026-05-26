/**
 * controllers/public/contactsController.ts
 * Controlador para enviar mensajes de contacto desde el formulario público.
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

    // Validaciones
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
