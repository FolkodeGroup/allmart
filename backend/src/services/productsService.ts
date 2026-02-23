/**
 * services/productsService.ts
 * Lógica de negocio para el dominio de productos.
 * Actualmente usa un store en memoria; sustituir por llamadas a BD.
 */

import { v4 as uuidv4 } from 'uuid';
import { Product, CreateProductDTO, UpdateProductDTO } from '../models/Product';
import { ProductStatus } from '../types';
import { createError } from '../middlewares/errorHandler';

// Store in-memory (reemplazar con repositorio de BD)
const store: Map<string, Product> = new Map();

export async function getAllProducts(): Promise<Product[]> {
  return Array.from(store.values());
}

export async function getProductById(id: string): Promise<Product> {
  const product = store.get(id);
  if (!product) throw createError('Producto no encontrado', 404);
  return product;
}

export async function createProduct(dto: CreateProductDTO): Promise<Product> {
  const now = new Date();
  const product: Product = {
    ...dto,
    id: uuidv4(),
    status: dto.status ?? ProductStatus.DRAFT,
    createdAt: now,
    updatedAt: now,
  };
  store.set(product.id, product);
  return product;
}

export async function updateProduct(id: string, dto: UpdateProductDTO): Promise<Product> {
  const existing = await getProductById(id);
  const updated: Product = { ...existing, ...dto, updatedAt: new Date() };
  store.set(id, updated);
  return updated;
}

export async function deleteProduct(id: string): Promise<void> {
  if (!store.has(id)) throw createError('Producto no encontrado', 404);
  store.delete(id);
}
