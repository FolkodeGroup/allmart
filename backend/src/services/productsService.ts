/**
 * services/productsService.ts
 * Lógica de negocio para el dominio de productos.
 * Actualmente usa un store en memoria; sustituir por llamadas a BD.
 */

import { v4 as uuidv4 } from "uuid";
import { Product, CreateProductDTO, UpdateProductDTO } from "../models/Product";
import { ProductStatus } from "../types";
import { createError } from "../middlewares/errorHandler";
import * as categoriesService from './categoriesService'; // Para obtener la categoría completa

// Store in-memory (reemplazar con repositorio de BD)
const store: Map<string, Product> = new Map();

// Función auxiliar para el slug (según requerimiento: auto-generar desde name)
function generateSlug(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

export async function getAllProducts(): Promise<Product[]> {
  return Array.from(store.values());
}

export async function getProductById(id: string): Promise<Product> {
  const product = store.get(id);
  if (!product) throw createError("Producto no encontrado", 404);
  return product;
}

export async function createProduct(dto: CreateProductDTO): Promise<Product> {
  // 1. Validar campos requeridos: name, price, categoryId, sku
  // (Nota: Ajusto a categoryId por tu interfaz, si es category_id cámbialo aquí)
  if (!dto.name || dto.price === undefined || !dto.categoryId || !dto.sku) {
    throw createError("Campos requeridos: name, price, categoryId, sku", 400);
  }

  // 2. Verifica que el SKU sea único
  const isSkuTaken = Array.from(store.values()).some((p) => p.sku === dto.sku);
  if (isSkuTaken) {
    throw createError(`El SKU "${dto.sku}" ya está en uso`, 409);
  }

  // 3. Obtener la categoría (para validar que existe y para la respuesta completa)
  const categoryId = await categoriesService.getCategoryById(dto.categoryId);

  // 4. Auto-generar slug a partir del name
  const slug = generateSlug(dto.name);

  const now = new Date();
  const product: Product = {
    ...dto,
    id: uuidv4(),
    slug,
    categoryId: categoryId.id, // Aseguramos que el producto tenga el ID de la categoría
    status: dto.status ?? ProductStatus.DRAFT,
    createdAt: now,
    updatedAt: now,
  };
  store.set(product.id, product);
  return product;
}

export async function updateProduct(id: string, dto: UpdateProductDTO): Promise<Product> {
  // 1. Verificar que el producto existe
  const existing = store.get(id);
  if (!existing) {
    throw createError('Producto no encontrado', 404);
  }

  // 2. Si se provee un nuevo SKU, verificar que sea único (excluyendo este producto)
  if (dto.sku && dto.sku !== existing.sku) {
    const isSkuTaken = Array.from(store.values()).some(
      (p) => p.sku === dto.sku && p.id !== id
    );
    if (isSkuTaken) {
      throw createError(`El SKU "${dto.sku}" ya está en uso por otro producto`, 409);
    }
  }

  // 3. Si se cambia el nombre, se re-genera el slug automáticamente (según issue)
  let slug = existing.slug;
  if (dto.name) {
    slug = generateSlug(dto.name);
  }

  // 4. Obtener la categoría (para la respuesta completa y validar si cambió)
  // Si el DTO no trae categoryId, usamos el que ya tenía el producto
  const categoryIdToFetch = dto.categoryId || existing.categoryId;
  const category = await categoriesService.getCategoryById(categoryIdToFetch);

  // 5. Mezclar los datos, actualizar el slug y la fecha de actualización
  const updatedProduct: Product = {
    ...existing,
    ...dto,
    slug,
    updatedAt: new Date(),
  };

  store.set(id, updatedProduct);

  // 6. RESULTADO ESPERADO: Devolver producto completo (con categoría)
  return {
    ...updatedProduct,
    categoryId: updatedProduct.categoryId
  };
}

export async function deleteProduct(id: string): Promise<void> {
  if (!store.has(id)) throw createError("Producto no encontrado", 404);
  store.delete(id);
}
