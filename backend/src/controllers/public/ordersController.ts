import { Request, Response } from "express";
import { CreatePublicOrderDTO } from "../../types";
import * as publicOrdersService from "../../services/publicOrderService";

export const create = async (req: Request, res: Response) => {
  try {
    const body: CreatePublicOrderDTO = req.body;

    // validaciones básicas de request
    if (!body.customer || !body.items?.length) {
      return res.status(400).json({ message: "Datos inválidos" });
    }

    const orderId = await publicOrdersService.createPublicOrder(body);

    return res.status(201).json({ orderId });

  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Error al crear pedido" });
  }
};