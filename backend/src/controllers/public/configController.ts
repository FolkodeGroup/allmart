/**
 * controllers/public/configController.ts
 * Controlador de configuración dinámica del sitio.
 */

import { Request, Response } from 'express';
import * as configService from '../../services/configService';

/** GET /api/config/navigation */
export const navigation = async (_req: Request, res: Response) => {
  try {
    const items = await configService.getNavigation();
    res.json({ data: items });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error interno' });
  }
};

/** GET /api/config/sort-options */
export const sortOptions = async (_req: Request, res: Response) => {
  try {
    const options = configService.getSortOptions();
    res.json({ data: options });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error interno' });
  }
};

/** GET /api/config/filters */
export const filters = async (_req: Request, res: Response) => {
  try {
    const filterData = await configService.getFilters();
    res.json({ data: filterData });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error interno' });
  }
};
