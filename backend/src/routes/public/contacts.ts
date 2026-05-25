/**
 * routes/public/contacts.ts
 * Rutas públicas para contactos.
 * POST /api/contacts - Enviar un formulario de contacto
 */

import { Router } from 'express';
import { submitContactForm } from '../../controllers/public/contactsController';

const router = Router();

router.post('/', submitContactForm);

export default router;
