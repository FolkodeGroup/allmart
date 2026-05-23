import { prisma } from '../config/prisma';
import type { Supplier } from '@prisma/client';

export interface SupplierInput {
    name: string;
    url?: string;
    phone: string;
    address: string;
    products: string;
}

export const suppliersService = {
    async getAll(): Promise<Supplier[]> {
        return prisma.supplier.findMany({
            orderBy: { name: 'asc' },
        });
    },

    async getById(id: string): Promise<Supplier | null> {
        return prisma.supplier.findUnique({ where: { id } });
    },

    async create(data: SupplierInput): Promise<Supplier> {
        return prisma.supplier.create({
            data: {
                name: data.name.trim(),
                url: data.url?.trim() || null,
                phone: data.phone.trim(),
                address: data.address.trim(),
                products: data.products.trim(),
            },
        });
    },

    async update(id: string, data: SupplierInput): Promise<Supplier | null> {
        const exists = await prisma.supplier.findUnique({ where: { id } });
        if (!exists) return null;
        return prisma.supplier.update({
            where: { id },
            data: {
                name: data.name.trim(),
                url: data.url?.trim() || null,
                phone: data.phone.trim(),
                address: data.address.trim(),
                products: data.products.trim(),
            },
        });
    },

    async delete(id: string): Promise<boolean> {
        const exists = await prisma.supplier.findUnique({ where: { id } });
        if (!exists) return false;
        await prisma.supplier.delete({ where: { id } });
        return true;
    },
};