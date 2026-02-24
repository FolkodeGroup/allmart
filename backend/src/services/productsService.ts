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

// 1️⃣ Función para obtener productos del catálogo (con filtros)
type ProductQuery = {
  category?: string;
  q?: string;
  sort?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
  page?: number;
  limit?: number;
};

export async function getPublicProducts(query: ProductQuery) {
  let products = Array.from(store.values());

  const { category, q, sort, page = 1, limit = 12 } = query;

  // Filtrar por categoría
  if (category) {
    products = products.filter(p => p.categoryId === category);
  }

  // Búsqueda por texto
  if (q) {
    const search = q.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.description?.toLowerCase().includes(search)
    );
  }

  // Ordenamiento
  if (sort) {
    switch (sort) {
      case 'price_asc':
        products.sort((a, b) => a.price - b.price);
        break;

      case 'price_desc':
        products.sort((a, b) => b.price - a.price);
        break;

      case 'newest':
        products.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
    }
  }

  const total = products.length;

  const start = (page - 1) * limit;
  const end = start + limit;

  const paginated = products.slice(start, end);

  const totalPages = Math.ceil(total / limit);

  return {
    data: paginated,
    total,
    page,
    limit,
    totalPages
  };
}
export async function getProductBySlug(slug: string): Promise<Product> {
  const product = Array.from(store.values()).find(p => p.slug === slug);

  if (!product) {
    throw createError('Producto no encontrado', 404);
  }

  return product;
}