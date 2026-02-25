// src/controllers/public/productsController.ts

import { Request, Response } from "express";
import { getPublicProducts, getProductBySlug } from "../../services/productsService";

export const index = async (req: Request, res: Response) => {
  const result = await getPublicProducts(req.query as any);
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