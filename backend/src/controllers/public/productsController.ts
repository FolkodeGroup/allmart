// src/controllers/public/productsController.ts

import { Request, Response } from "express";
import { getPublicProducts, getProductBySlug } from "../../services/productsService";

export const index = async (req: Request, res: Response) => {
  const { category, q, sort, page, limit } = req.query;
  const result = await getPublicProducts({
    category: category as string,
    q: q as string,
    sort: sort as any,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
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