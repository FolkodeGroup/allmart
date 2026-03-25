import { z } from 'zod';

export const orderConfirmationSchema = z.object({
    firstName: z.string().min(1, 'El nombre es obligatorio'),
    lastName: z.string().min(1, 'El apellido es obligatorio'),
    email: z.string().email('El email no es válido'),
});

export type OrderConfirmationSchema = z.infer<typeof orderConfirmationSchema>;
