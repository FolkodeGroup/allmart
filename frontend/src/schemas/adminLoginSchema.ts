import { z } from 'zod';

export const adminLoginSchema = z.object({
    user: z.string().min(1, 'El usuario es obligatorio'),
    password: z.string().min(1, 'La contraseña es obligatoria'),
});

export type AdminLoginSchema = z.infer<typeof adminLoginSchema>;
