/**
 * controllers/admin/reportsController.ts
 * Controlador del módulo de reportes (Admin).
 */

import { Request, Response } from "express";
import * as reportsService from "../../services/reportsService";

// ─────────────────────────────────────────────────────────────
// 1️⃣ Summary
// GET /api/admin/reports/summary?period=7d|30d|90d
// ─────────────────────────────────────────────────────────────

export const summary = async (req: Request, res: Response) => {
  try {
    const { period } = req.query;

    const data = await reportsService.getSummary(
      typeof period === "string" ? period : undefined
    );

    return res.json(data);
  } catch (error) {
    console.error("Error in reports.summary:", error);
    return res.status(500).json({
      message: "Error al obtener resumen de reportes",
    });
  }
};

// ─────────────────────────────────────────────────────────────
// 2️⃣ Sales by Day
// GET /api/admin/reports/sales-by-day?period=7d|30d|90d
// ─────────────────────────────────────────────────────────────

export const salesByDay = async (req: Request, res: Response) => {
  try {
    const { period } = req.query;

    const data = await reportsService.getSalesByDay(
      typeof period === "string" ? period : undefined
    );

    return res.json(data);
  } catch (error) {
    console.error("Error in reports.salesByDay:", error);
    return res.status(500).json({
      message: "Error al obtener ventas por día",
    });
  }
};

// ─────────────────────────────────────────────────────────────
// 3️⃣ Orders by Status
// GET /api/admin/reports/orders-by-status
// ─────────────────────────────────────────────────────────────

export const ordersByStatus = async (_req: Request, res: Response) => {
  try {
    const data = await reportsService.getOrdersByStatus();
    return res.json(data);
  } catch (error) {
    console.error("Error in reports.ordersByStatus:", error);
    return res.status(500).json({
      message: "Error al obtener pedidos por estado",
    });
  }
};

// ─────────────────────────────────────────────────────────────
// 4️⃣ Top Products
// GET /api/admin/reports/top-products?limit=10
// ─────────────────────────────────────────────────────────────

export const topProducts = async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;

    const parsedLimit =
      typeof limit === "string" ? parseInt(limit, 10) : 10;

    const data = await reportsService.getTopProducts(
      isNaN(parsedLimit) ? 10 : parsedLimit
    );

    return res.json(data);
  } catch (error) {
    console.error("Error in reports.topProducts:", error);
    return res.status(500).json({
      message: "Error al obtener productos más vendidos",
    });
  }
};