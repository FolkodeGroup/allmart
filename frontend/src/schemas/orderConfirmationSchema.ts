import { z } from 'zod';

export const orderConfirmationSchema = z.object({
    firstName: z.string().min(1, 'El nombre es obligatorio'),
    lastName: z.string().min(1, 'El apellido es obligatorio'),
    email: z.string().email('El email no es válido'),
    phone: z
        .string()
        .min(1, 'El celular es obligatorio')
        .refine((value) => {
            const digits = value.replace(/\D/g, '');
            return digits.length >= 8 && digits.length <= 15;
        }, 'El celular no es válido'),
});

export type OrderConfirmationSchema = z.infer<typeof orderConfirmationSchema>;
