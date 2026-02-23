import { Router } from 'express';
// 1. Importarás un controlador (que tendrías que crear o usar uno existente)
// import * as ctrl from '../../controllers/categoriesController'; 

const router = Router();

// 2. Definir las rutas públicas (SIN middlewares de auth ni requireRole)
// GET /api/categories
// router.get('/', ctrl.indexPublic); 

// // GET /api/categories/:slug
// router.get('/:slug', ctrl.showBySlug);

export default router;
// Nota: para subir a github