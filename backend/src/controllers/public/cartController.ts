import { Request, Response, NextFunction } from 'express';
import * as cartService from '../../services/cartService';
import { v4 as uuidv4 } from 'uuid';

function getSessionId(req: Request, res: Response): string {
  let sessionId = req.cookies.session_id;
  if (!sessionId) {
    sessionId = uuidv4();
    // Cookie dura 1 año
    res.cookie('session_id', sessionId, { maxAge: 31536000000, httpOnly: true, sameSite: 'lax' });
  }
  return sessionId;
}

export async function getCart(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = getSessionId(req, res);
    const cart = await cartService.getCart(sessionId);
    res.json(cart);
  } catch (err) {
    next(err);
  }
}

export async function addItem(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = getSessionId(req, res);
    const { productId, productSkuId, quantity } = req.body;
    const cart = await cartService.addItem(sessionId, productId, productSkuId ?? null, quantity ?? 1);
    res.json(cart);
  } catch (err) {
    next(err);
  }
}

export async function updateItem(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = getSessionId(req, res);
    const { productId } = req.params;
    const { quantity, productSkuId } = req.body;
    const cart = await cartService.updateItem(sessionId, productId, productSkuId ?? null, quantity);
    res.json(cart);
  } catch (err) {
    next(err);
  }
}

export async function removeItem(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = getSessionId(req, res);
    const { productId } = req.params;
    const { productSkuId } = req.body;
    const skuId = productSkuId || req.query.productSkuId;
    const cart = await cartService.removeItem(sessionId, productId, (skuId as string) ?? null);
    res.json(cart);
  } catch (err) {
    next(err);
  }
}

export async function clearCart(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = getSessionId(req, res);
    const cart = await cartService.clearCart(sessionId);
    res.json(cart);
  } catch (err) {
    next(err);
  }
}