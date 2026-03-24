import { z } from 'zod';

export const bulkEditSchema = z.object({
    price: z.union([
        z.string().regex(/^\d*(\.\d{1,2})?$/, 'Debe ser un número válido').optional().or(z.literal('')),
        z.number().min(0, 'El precio debe ser mayor o igual a 0').optional()
    ]),
    stock: z.union([
        z.string().regex(/^\d*$/, 'Debe ser un número entero').optional().or(z.literal('')),
        z.number().min(0, 'El stock debe ser mayor o igual a 0').optional()
    ]),
    inStock: z.string().optional(),
});

export type BulkEditSchema = z.infer<typeof bulkEditSchema>;
