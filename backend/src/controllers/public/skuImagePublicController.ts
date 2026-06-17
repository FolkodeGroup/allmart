import { Request, Response, NextFunction } from 'express';
import * as skuService from '../../services/productSkuImageService';

export async function serveSkuImageThumb(req: Request, res: Response, next: NextFunction) {
    try {
        const { data, mimeType } = await skuService.serveSkuImageThumb(req.params.id);
        res.set('Content-Type', mimeType);
        res.set('Cache-Control', 'public, max-age=86400');
        res.set('Content-Length', String(data.length));
        res.send(data);
    } catch (err) {
        next(err);
    }
}

export async function serveSkuImage(req: Request, res: Response, next: NextFunction) {
    try {
        const { data, mimeType } = await skuService.serveSkuImage(req.params.id);
        res.set('Content-Type', mimeType);
        res.set('Cache-Control', 'public, max-age=86400');
        res.set('Content-Length', String(data.length));
        res.send(data);
    } catch (err) {
        next(err);
    }
}
