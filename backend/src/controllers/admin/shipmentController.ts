import { Request, Response } from 'express';
import * as shipmentService from '../../services/shipmentService';

export async function upsertShipment(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const shipment = await shipmentService.upsertShipment(
      id,
      req.body
    );

    return res.status(200).json(shipment);
  } catch (error: any) {
    if (error.message === 'Order not found') {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
}