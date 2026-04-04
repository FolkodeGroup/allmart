/**
 * services/collectionsService.ts
 * CRUD y lógica de negocio para colecciones.
 */

import { Collection, CollectionItem, CollectionDisplayPosition, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { createError } from '../middlewares/errorHandler';

export interface CreateCollectionDTO {
  name: string;
  slug?: string;
  description?: string;
  displayOrder?: number;
  displayPosition: CollectionDisplayPosition;
  imageUrl?: string;
  isActive?: boolean;
  productIds?: string[];
}

export interface UpdateCollectionDTO {
  name?: string;
  slug?: string;
  description?: string;
  displayOrder?: number;
  displayPosition?: CollectionDisplayPosition;
  imageUrl?: string;
  isActive?: boolean;
  productIds?: string[];
}

export interface CollectionResponseDTO {
  id: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
  displayPosition: string;
  imageUrl?: string;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
  products?: Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    imageUrl?: string;
    position: number;
  }>;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
}

type LegacyImageValue = string | { url?: unknown } | null | undefined;

function normalizeImageUrl(value: LegacyImageValue): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (value && typeof value === 'object' && 'url' in value) {
    const nestedUrl = (value as { url?: unknown }).url;
    if (typeof nestedUrl === 'string') {
      const trimmed = nestedUrl.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
  }

  return undefined;
}

function getFirstImageUrl(images: unknown): string | undefined {
  if (!Array.isArray(images)) {
    return undefined;
  }

  for (const image of images as LegacyImageValue[]) {
    const normalized = normalizeImageUrl(image);
    if (normalized) {
      return normalized;
    }
  }

  return undefined;
}

function toCollectionDTO(
  collection: Collection,
  productCount: number,
  products?: any[]
): CollectionResponseDTO {
  return {
    id: collection.id,
    name: collection.name,
    slug: collection.slug,
    description: collection.description ?? undefined,
    displayOrder: collection.displayOrder,
    displayPosition: collection.displayPosition,
    imageUrl: collection.imageUrl ?? undefined,
    isActive: collection.isActive,
    productCount,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
    products: products?.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      price: item.product.price.toNumber(),
      imageUrl: getFirstImageUrl(item.product.images),
      position: item.position,
    })),
  };
}

/**
 * Obtiene todas las colecciones con paginación
 */
export async function getAllCollections(
  skip = 0,
  take = 10,
  filters?: { isActive?: boolean; displayPosition?: CollectionDisplayPosition; search?: string }
): Promise<{
  data: CollectionResponseDTO[];
  total: number;
}> {
  const where: Prisma.CollectionWhereInput = {};

  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters?.displayPosition) {
    where.displayPosition = filters.displayPosition;
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [collections, total] = await Promise.all([
    prisma.collection.findMany({
      where,
      skip,
      take,
      orderBy: { displayOrder: 'asc' },
      include: {
        collectionItems: {
          include: { product: true },
          orderBy: { position: 'asc' },
        },
      },
    }),
    prisma.collection.count({ where }),
  ]);

  return {
    data: collections.map((c) =>
      toCollectionDTO(
        c,
        c.collectionItems.length,
        c.collectionItems
      )
    ),
    total,
  };
}

/**
 * Obtiene una colección por ID con sus productos
 */
export async function getCollectionById(id: string): Promise<CollectionResponseDTO> {
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      collectionItems: {
        include: { product: true },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!collection) {
    throw createError('Colección no encontrada', 404);
  }

  return toCollectionDTO(
    collection,
    collection.collectionItems.length,
    collection.collectionItems
  );
}

/**
 * Obtiene una colección por slug (para uso público)
 */
export async function getCollectionBySlug(slug: string): Promise<CollectionResponseDTO> {
  const collection = await prisma.collection.findUnique({
    where: { slug },
    include: {
      collectionItems: {
        include: { product: true },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!collection) {
    throw createError('Colección no encontrada', 404);
  }

  if (!collection.isActive) {
    throw createError('Esta colección no está disponible', 403);
  }

  return toCollectionDTO(
    collection,
    collection.collectionItems.length,
    collection.collectionItems
  );
}

/**
 * Obtiene colecciones activas por posición de display
 */
export async function getCollectionsByDisplayPosition(
  position: CollectionDisplayPosition
): Promise<CollectionResponseDTO[]> {
  const collections = await prisma.collection.findMany({
    where: {
      isActive: true,
      displayPosition: position,
    },
    orderBy: { displayOrder: 'asc' },
    include: {
      collectionItems: {
        include: { product: true },
        orderBy: { position: 'asc' },
      },
    },
  });

  return collections.map((c) =>
    toCollectionDTO(
      c,
      c.collectionItems.length,
      c.collectionItems.slice(0, 10) // Limitar a 10 productos para no saturar
    )
  );
}

/**
 * Crea una nueva colección con productos
 */
export async function createCollection(dto: CreateCollectionDTO): Promise<CollectionResponseDTO> {
  // Validaciones
  if (!dto.name || !dto.displayPosition) {
    throw createError('Campos requeridos: name, displayPosition', 400);
  }

  // Generar slug si no se proporciona
  const slug = dto.slug || generateSlug(dto.name);

  // Verificar que el slug sea único
  const existingSlug = await prisma.collection.findUnique({ where: { slug } });
  if (existingSlug) {
    throw createError(`El slug "${slug}" ya está en uso`, 409);
  }

  // Crear colección
  const collection = await prisma.collection.create({
    data: {
      name: dto.name,
      slug,
      description: dto.description ?? null,
      displayOrder: dto.displayOrder ?? 0,
      displayPosition: dto.displayPosition,
      imageUrl: dto.imageUrl ?? null,
      isActive: dto.isActive ?? true,
    },
  });

  // Agregar productos if provided
  if (dto.productIds && dto.productIds.length > 0) {
    for (let i = 0; i < dto.productIds.length; i++) {
      await prisma.collectionItem.create({
        data: {
          collectionId: collection.id,
          productId: dto.productIds[i],
          position: i,
        },
      });
    }
  }

  return getCollectionById(collection.id);
}

/**
 * Actualiza una colección y sus productos
 */
export async function updateCollection(
  id: string,
  dto: UpdateCollectionDTO
): Promise<CollectionResponseDTO> {
  const existing = await prisma.collection.findUnique({ where: { id } });
  if (!existing) {
    throw createError('Colección no encontrada', 404);
  }

  // Verificar slug único si se actualiza
  if (dto.slug && dto.slug !== existing.slug) {
    const slugExists = await prisma.collection.findUnique({
      where: { slug: dto.slug },
    });
    if (slugExists) {
      throw createError(`El slug "${dto.slug}" ya está en uso`, 409);
    }
  }

  // Actualizar colección
  await prisma.collection.update({
    where: { id },
    data: {
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      displayOrder: dto.displayOrder,
      displayPosition: dto.displayPosition,
      imageUrl: dto.imageUrl,
      isActive: dto.isActive,
    },
  });

  // Actualizar productos if provided
  if (dto.productIds !== undefined) {
    // Eliminar items existentes
    await prisma.collectionItem.deleteMany({ where: { collectionId: id } });

    // Crear nuevos items
    for (let i = 0; i < dto.productIds.length; i++) {
      await prisma.collectionItem.create({
        data: {
          collectionId: id,
          productId: dto.productIds[i],
          position: i,
        },
      });
    }
  }

  return getCollectionById(id);
}

/**
 * Elimina una colección y sus relaciones
 */
export async function deleteCollection(id: string): Promise<void> {
  const existing = await prisma.collection.findUnique({ where: { id } });
  if (!existing) {
    throw createError('Colección no encontrada', 404);
  }

  // Eliminar items de la colección
  await prisma.collectionItem.deleteMany({ where: { collectionId: id } });

  // Eliminar colección
  await prisma.collection.delete({ where: { id } });
}

/**
 * Reordena los productos dentro de una colección
 */
export async function reorderCollectionItems(
  collectionId: string,
  productOrder: string[]
): Promise<void> {
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
  });

  if (!collection) {
    throw createError('Colección no encontrada', 404);
  }

  // Actualizar orden de cada producto
  for (let i = 0; i < productOrder.length; i++) {
    await prisma.collectionItem.updateMany({
      where: {
        collectionId,
        productId: productOrder[i],
      },
      data: { position: i },
    });
  }
}

/**
 * Agrega un producto a una colección
 */
export async function addProductToCollection(
  collectionId: string,
  productId: string
): Promise<void> {
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
  });

  if (!collection) {
    throw createError('Colección no encontrada', 404);
  }

  // Verificar que el producto no esté ya en la colección
  const existing = await prisma.collectionItem.findUnique({
    where: {
      collectionId_productId: {
        collectionId,
        productId,
      },
    },
  });

  if (existing) {
    throw createError('El producto ya está en esta colección', 409);
  }

  // Obtener la última posición
  const lastItem = await prisma.collectionItem.findFirst({
    where: { collectionId },
    orderBy: { position: 'desc' },
  });

  const newPosition = (lastItem?.position ?? -1) + 1;

  await prisma.collectionItem.create({
    data: {
      collectionId,
      productId,
      position: newPosition,
    },
  });
}

/**
 * Elimina un producto de una colección
 */
export async function removeProductFromCollection(
  collectionId: string,
  productId: string
): Promise<void> {
  const existing = await prisma.collectionItem.findUnique({
    where: {
      collectionId_productId: {
        collectionId,
        productId,
      },
    },
  });

  if (!existing) {
    throw createError('Producto no encontrado en la colección', 404);
  }

  await prisma.collectionItem.delete({
    where: {
      collectionId_productId: {
        collectionId,
        productId,
      },
    },
  });
}
