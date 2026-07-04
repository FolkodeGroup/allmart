import { Request, Response } from 'express';
import * as favoritesService from '../../services/favoritesService';
import { v4 as uuidv4 } from 'uuid';

function getSessionId(req: Request, res: Response): string {
  let sessionId = req.cookies.session_id;
  if (!sessionId) {
    sessionId = uuidv4();
    res.cookie('session_id', sessionId, { maxAge: 31536000000, httpOnly: true, sameSite: 'lax' });
  }
  return sessionId;
}

export const index = async (req: Request, res: Response) => {
  try {
    const sessionId = getSessionId(req, res);
    const favorites = await favoritesService.getUserFavorites(sessionId);
    res.json({ data: favorites });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Error interno' });
  }
};

export const toggle = async (req: Request, res: Response) => {
  try {
    const sessionId = getSessionId(req, res);
    const { productId } = req.params;
    const result = await favoritesService.toggleFavorite(sessionId, productId);
    res.json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Error interno' });
  }
};

export const check = async (req: Request, res: Response) => {
  try {
    const sessionId = getSessionId(req, res);
    const { productId } = req.params;
    const result = await favoritesService.checkFavorite(sessionId, productId);
    res.json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Error interno' });
  }
};

export const destroy = async (req: Request, res: Response) => {
  try {
    const sessionId = getSessionId(req, res);
    const { productId } = req.params;
    await favoritesService.removeFavorite(sessionId, productId);
    res.status(204).send();
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Error interno' });
  }
};