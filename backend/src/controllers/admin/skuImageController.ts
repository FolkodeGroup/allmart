import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import * as skuService from '../../services/productSkuImageService';
import { sendSuccess } from '../../utils/response';

export async function uploadSkuImage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        const { skuId } = req.params;
        if (!req.file) {
            res.status(400).json({ success: false, message: 'No file sent (field "image")' });
            return;
        }
        const file = { buffer: req.file.buffer, originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size };
        const image = await skuService.uploadSkuImage(skuId, file, req.body.altText, req.body.position !== undefined ? parseInt(req.body.position, 10) : undefined, req.body.isPrimary === 'true' || req.body.isPrimary === true);
        sendSuccess(res, image, 201, 'SKU image uploaded');
    } catch (err) {
        next(err);
    }
}

export async function listSkuImages(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        const images = await skuService.getSkuImages(req.params.skuId);
        sendSuccess(res, images);
    } catch (err) {
        next(err);
    }
}

export async function showSkuImageMeta(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        const meta = await skuService.getSkuImageMeta(req.params.id);
        sendSuccess(res, meta);
    } catch (err) {
        next(err);
    }
}

export async function updateSkuImageMeta(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        const { altText, position, isPrimary } = req.body;
        const normalizedPosition = position !== undefined ? parseInt(position, 10) : undefined;
        const normalizedPrimary = isPrimary !== undefined ? Boolean(isPrimary) : undefined;
        const meta = await skuService.updateSkuImageMeta(req.params.id, { altText, position: normalizedPosition, isPrimary: normalizedPrimary });
        sendSuccess(res, meta, 200, 'SKU image meta updated');
    } catch (err) {
        next(err);
    }
}

export async function deleteSkuImage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        await skuService.deleteSkuImage(req.params.id);
        sendSuccess(res, null, 200, 'SKU image deleted');
    } catch (err) {
        next(err);
    }
}
