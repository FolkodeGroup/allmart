import { Router, Request, Response } from 'express';
import { suppliersService } from '../../services/suppliersService';

const router = Router();

// GET /api/admin/suppliers
router.get('/', async (_req: Request, res: Response) => {
    try {
        const suppliers = await suppliersService.getAll();
        res.json({ success: true, data: suppliers });
    } catch (err) {
        console.error('[suppliers] getAll error:', err);
        res.status(500).json({ success: false, error: 'Error al obtener proveedores' });
    }
});

// GET /api/admin/suppliers/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const supplier = await suppliersService.getById(req.params.id);
        if (!supplier) {
            return res.status(404).json({ success: false, error: 'Proveedor no encontrado' });
        }
        res.json({ success: true, data: supplier });
    } catch (err) {
        console.error('[suppliers] getById error:', err);
        res.status(500).json({ success: false, error: 'Error al obtener proveedor' });
    }
});

// POST /api/admin/suppliers
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, url, phone, address } = req.body;
        if (!name?.trim() || !phone?.trim() || !address?.trim()) {
            return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
        }
        const supplier = await suppliersService.create({ name, url, phone, address });
        res.status(201).json({ success: true, data: supplier });
    } catch (err) {
        console.error('[suppliers] create error:', err);
        res.status(500).json({ success: false, error: 'Error al crear proveedor' });
    }
});

// PUT /api/admin/suppliers/:id
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { name, url, phone, address } = req.body;
        if (!name?.trim() || !phone?.trim() || !address?.trim()) {
            return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
        }
        const supplier = await suppliersService.update(req.params.id, { name, url, phone, address });
        if (!supplier) {
            return res.status(404).json({ success: false, error: 'Proveedor no encontrado' });
        }
        res.json({ success: true, data: supplier });
    } catch (err) {
        console.error('[suppliers] update error:', err);
        res.status(500).json({ success: false, error: 'Error al actualizar proveedor' });
    }
});

// DELETE /api/admin/suppliers/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const deleted = await suppliersService.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Proveedor no encontrado' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error('[suppliers] delete error:', err);
        res.status(500).json({ success: false, error: 'Error al eliminar proveedor' });
    }
});

export default router;