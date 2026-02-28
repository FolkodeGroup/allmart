// controllers/public/cartController.ts
import { Request, Response, NextFunction } from 'express';
import * as cartService from '../../services/cartService';

// Devuelve el carrito actual
export async function getCart(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const sessionId = req.cookies.session_id;
    const cart = await cartService.getCart(userId, sessionId);
    res.json(cart);
  } catch (err) {
    next(err);
  }
}

// Agrega un producto al carrito
export async function addItem(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const sessionId = req.cookies.session_id;
    const { productId, quantity } = req.body;
    const cart = await cartService.addItem(userId, sessionId, productId, quantity ?? 1);
    res.json(cart);
  } catch (err) {
    next(err);
  }
}

// Actualiza la cantidad de un producto
export async function updateItem(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const sessionId = req.cookies.session_id;
    const { productId } = req.params;
    const { quantity } = req.body;
    const cart = await cartService.updateItem(userId, sessionId, productId, quantity);
    res.json(cart);
  } catch (err) {
    next(err);
  }
}

// Elimina un producto del carrito
export async function removeItem(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const sessionId = req.cookies.session_id;
    const { productId } = req.params;
    const cart = await cartService.removeItem(userId, sessionId, productId);
    res.json(cart);
  } catch (err) {
    next(err);
  }
}

// Vacía todo el carrito
export async function clearCart(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const sessionId = req.cookies.session_id;
    const cart = await cartService.clearCart(userId, sessionId);
    res.json(cart);
  } catch (err) {
    next(err);
  }
}