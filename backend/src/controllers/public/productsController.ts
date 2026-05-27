// src/controllers/public/productsController.ts

import { Request, Response } from "express";
import { getPublicProducts, getProductBySlug } from "../../services/productsService";

export const index = async (req: Request, res: Response) => {
  const { category, tag, q, sort, page, limit, isFeatured, isOnSale, isNovedad, slugs } = req.query;
  const result = await getPublicProducts({
    category: category as string,
    tag: tag as string,
    q: q as string,
    sort: sort as any,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    slugs: slugs as string,
    isFeatured: typeof isFeatured !== 'undefined'
      ? isFeatured === 'true'
      : undefined,
    isOnSale: typeof isOnSale !== 'undefined'
      ? isOnSale === 'true'
      : undefined,
    isNovedad: typeof isNovedad !== 'undefined'
      ? isNovedad === 'true'
      : undefined,
  });
  res.json(result);
};

export const show = async (req: Request, res: Response) => {
  const { slug } = req.params;

  try {
    const product = await getProductBySlug(slug);
    res.json(product);
  } catch (error: any) {
    res.status(error.status || 500).json({
      message: error.message || "Error interno"
    });
  }
};