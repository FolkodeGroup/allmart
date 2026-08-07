import { Request, Response } from 'express';
import * as shipmentService from '../../services/shipmentService';
import { sendSuccess } from '../../utils/response';

export async function upsertShipment(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const shipment = await shipmentService.upsertShipment(
      id,
      req.body
    );

    return sendSuccess(res, shipment, 200, 'Datos de envío guardados correctamente');
  } catch (error: any) {
    if (error.message === 'Order not found') {
      return res.status(404).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}