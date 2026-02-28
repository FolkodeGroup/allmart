import { Router } from 'express';
import * as ctrl from '../../controllers/public/cartController';

const router = Router();

// Devuelve el carrito actual
router.get('/', ctrl.getCart);

// Agrega un producto al carrito
router.post('/items', ctrl.addItem);

// Actualiza la cantidad de un producto
router.put('/items/:productId', ctrl.updateItem);

// Elimina un producto del carrito
router.delete('/items/:productId', ctrl.removeItem);

// Vacía el carrito completo
router.delete('/', ctrl.clearCart);

export default router;