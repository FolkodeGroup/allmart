/**
 * backend/src/routes/public/contacts.ts
 * Rutas públicas para contactos.
 */

import { Router } from 'express';
import { submitContactForm, submitWithdrawalForm } from '../../controllers/public/contactsController';

const router = Router();

// Formulario de contacto general
router.post('/', submitContactForm);

// NUEVO: Formulario específico de arrepentimiento
router.post('/withdrawal', submitWithdrawalForm);

export default router;