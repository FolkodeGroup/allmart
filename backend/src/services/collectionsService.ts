/**
 * services/collectionsService.ts
 * CRUD y lógica de negocio para colecciones con filtrado de productos activos.
 */

import { Collection, CollectionDisplayPosition, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { createError } from '../middlewares/errorHandler';
import { syncAutoCollection, syncDynamicCollection, type AutoSalesParams } from '../jobs/collectionsJob';

export interface CreateCollectionDTO {
  name: string;
  slug?: string;
  description?: string;
  displayOrder?: number;
  displayPosition: CollectionDisplayPosition;
  imageUrl?: string;
  isActive?: boolean;
  productIds?: string[];
  type?: string;
  params?: AutoSalesParams;
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
  type?: string;
  params?: AutoSalesParams;
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
  type: string;
  params: AutoSalesParams;
  snapshotAt?: string;
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
    category?: { id?: string; name: string; slug: string } | string;
    categoryName?: string;
    variants?: any[];
    skus?: any[];
  }>;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
}

/**
 * Filtro común para incluir solo productos activos y sus categorías en las colecciones.
 */
const activeProductItemInclude = {
  include: {
    product: {
      include: {
        productCategories: {
          include: {
            category: true,
          },
          orderBy: {
            createdAt: 'asc' as const,
          },
        },
        productImages: { select: { id: true }, orderBy: { position: 'asc' as const } },
        productOptions: {
          where: { isActive: true },
          include: { values: true },
        },
        productSkus: {
          where: { isActive: true },
          include: {
            skuValues: {
              include: {
                optionValue: {
                  include: { option: true },
                },
              },
            },
            productSkuImages: { select: { id: true } },
          },
        },
      },
    },
  },
  where: {
    product: {
      status: 'active' as const,
    },
  },
  orderBy: { position: 'asc' as const },
};

function toCollectionDTO(
  collection: Collection,
  productCount: number,
  products?: any[]
): CollectionResponseDTO {
  const mappedProducts = Array.isArray(products)
    ? products
        .filter((item: any) => item && item.product && (!item.product.status || item.product.status === 'active'))
        .map((item: any) => {
          const baseProduct = item.product;
          const variants = Array.isArray(baseProduct.productOptions)
            ? baseProduct.productOptions.map((opt: any) => ({
                id: opt.id,
                name: opt.name,
                values: Array.isArray(opt.values) ? opt.values.map((val: any) => val.name) : [],
              }))
            : [];

          const baseImages: string[] = Array.isArray(baseProduct.productImages)
            ? baseProduct.productImages.map((img: any) => `/api/images/products/${img.id}`)
            : [];

          const skus = Array.isArray(baseProduct.productSkus)
            ? baseProduct.productSkus.map((s: any) => {
                const attributes: Record<string, string> = {};
                if (Array.isArray(s.skuValues)) {
                  for (const sv of s.skuValues) {
                    if (sv?.optionValue?.option?.name && sv.optionValue.name) {
                      attributes[sv.optionValue.option.name] = sv.optionValue.name;
                    }
                  }
                }
                const skuImages = Array.isArray(s.productSkuImages) && s.productSkuImages.length > 0
                  ? s.productSkuImages.map((img: any) => `/api/images/sku/${img.id}`)
                  : baseImages;

                const skuPrice = s.price !== null && s.price !== undefined
                  ? Number(s.price)
                  : Number(baseProduct.price);

                return {
                  id: s.id,
                  sku: s.sku,
                  attributes,
                  images: skuImages,
                  stock: typeof s.stock === 'number' ? s.stock : Number(s.stock ?? 0),
                  price: skuPrice,
                  isActive: s.isActive ?? true,
                };
              })
            : [];

          const priceNum = typeof baseProduct.price === 'object' && baseProduct.price !== null && typeof baseProduct.price.toNumber === 'function'
            ? baseProduct.price.toNumber()
            : Number(baseProduct.price ?? 0);

          const primaryCategoryObj = Array.isArray(baseProduct.productCategories) && baseProduct.productCategories.length > 0
            ? baseProduct.productCategories[0]?.category
            : (baseProduct.category && typeof baseProduct.category === 'object' ? baseProduct.category : undefined);

          const primaryCategoryName = primaryCategoryObj?.name 
            ?? (typeof baseProduct.category === 'string' ? baseProduct.category : undefined);

          const categoryValue = primaryCategoryObj 
            ?? (primaryCategoryName ? { name: primaryCategoryName, slug: generateSlug(primaryCategoryName) } : undefined);

          return {
            id: baseProduct.id,
            name: baseProduct.name,
            slug: baseProduct.slug,
            price: priceNum,
            imageUrl: baseProduct.imageUrl ?? baseImages[0] ?? undefined,
            position: typeof item.position === 'number' ? item.position : 0,
            category: categoryValue,
            categoryName: primaryCategoryName,
            variants,
            skus,
          };
        })
    : undefined;

  return {
    id: collection.id,
    name: collection.name,
    slug: collection.slug,
    description: collection.description ?? undefined,
    displayOrder: collection.displayOrder,
    displayPosition: collection.displayPosition,
    imageUrl: collection.imageUrl ?? undefined,
    isActive: collection.isActive,
    type: collection.type ?? 'manual',
    params: (collection.params as AutoSalesParams) ?? {},
    snapshotAt: collection.snapshotAt ? collection.snapshotAt.toISOString() : undefined,
    productCount,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
    products: mappedProducts,
  };
}

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
        collectionItems: activeProductItemInclude,
      },
    }),
    prisma.collection.count({ where }),
  ]);

  return {
    data: collections.map((c) =>
      toCollectionDTO(
        c,
        c.collectionItems?.length ?? 0,
        c.collectionItems
      )
    ),
    total,
  };
}

export async function getCollectionById(id: string): Promise<CollectionResponseDTO> {
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      collectionItems: activeProductItemInclude,
    },
  });

  if (!collection) {
    throw createError('Colección no encontrada', 404);
  }

  return toCollectionDTO(
    collection,
    collection.collectionItems?.length ?? 0,
    collection.collectionItems
  );
}

export async function getCollectionBySlug(slug: string): Promise<CollectionResponseDTO> {
  const collection = await prisma.collection.findUnique({
    where: { slug },
    include: {
      collectionItems: activeProductItemInclude,
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
    collection.collectionItems?.length ?? 0,
    collection.collectionItems
  );
}

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
      collectionItems: activeProductItemInclude,
    },
  });

  return collections.map((c) =>
    toCollectionDTO(
      c,
      c.collectionItems?.length ?? 0,
      c.collectionItems?.slice(0, 10)
    )
  );
}

export async function getAllCollectionsUnpaginated(): Promise<CollectionResponseDTO[]> {
  const collections = await prisma.collection.findMany({
    orderBy: { displayOrder: 'asc' },
    include: {
      collectionItems: activeProductItemInclude,
    },
  });

  return collections.map((c) =>
    toCollectionDTO(
      c,
      c.collectionItems?.length ?? 0,
      c.collectionItems
    )
  );
}

export async function createCollection(dto: CreateCollectionDTO): Promise<CollectionResponseDTO> {
  if (!dto.name || !dto.displayPosition) {
    throw createError('Campos requeridos: name, displayPosition', 400);
  }

  const slug = dto.slug || generateSlug(dto.name);

  const existingSlug = await prisma.collection.findUnique({ where: { slug } });
  if (existingSlug) {
    throw createError(`El slug "${slug}" ya está en uso`, 409);
  }

  const collection = await prisma.collection.create({
    data: {
      name: dto.name,
      slug,
      description: dto.description ?? null,
      displayOrder: dto.displayOrder ?? 0,
      displayPosition: dto.displayPosition,
      imageUrl: dto.imageUrl ?? null,
      isActive: dto.isActive ?? true,
      type: dto.type ?? 'manual',
      params: (dto.params ?? {}) as Prisma.InputJsonValue,
    },
  });

  if (dto.type === 'manual' && dto.productIds && dto.productIds.length > 0) {
    for (let i = 0; i < dto.productIds.length; i++) {
      await prisma.collectionItem.create({
        data: {
          collectionId: collection.id,
          productId: dto.productIds[i],
          position: i,
        },
      });
    }
  } else if (dto.type === 'auto_sales') {
    await syncAutoCollection(collection.id).catch((e) => console.error('Error auto-sync:', e));
  } else if (dto.type === 'dynamic_rules') {
    await syncDynamicCollection(collection.id).catch((e) => console.error('Error dynamic-sync:', e));
  }

  return getCollectionById(collection.id);
}

export async function updateCollection(
  id: string,
  dto: UpdateCollectionDTO
): Promise<CollectionResponseDTO> {
  const existing = await prisma.collection.findUnique({ where: { id } });
  if (!existing) {
    throw createError('Colección no encontrada', 404);
  }

  if (dto.slug && dto.slug !== existing.slug) {
    const slugExists = await prisma.collection.findUnique({
      where: { slug: dto.slug },
    });
    if (slugExists) {
      throw createError(`El slug "${dto.slug}" ya está en uso`, 409);
    }
  }

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
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.params !== undefined && { params: dto.params as Prisma.InputJsonValue }),
    },
  });

  const activeType = dto.type ?? existing.type;

  if (activeType === 'manual' && dto.productIds !== undefined) {
    await prisma.collectionItem.deleteMany({ where: { collectionId: id } });

    for (let i = 0; i < dto.productIds.length; i++) {
      await prisma.collectionItem.create({
        data: {
          collectionId: id,
          productId: dto.productIds[i],
          position: i,
        },
      });
    }
  } else if (activeType === 'auto_sales') {
    await syncAutoCollection(id).catch((e) => console.error('Error auto-sync:', e));
  } else if (activeType === 'dynamic_rules') {
    await syncDynamicCollection(id).catch((e) => console.error('Error dynamic-sync:', e));
  }

  return getCollectionById(id);
}

export async function deleteCollection(id: string): Promise<void> {
  const existing = await prisma.collection.findUnique({ where: { id } });
  if (!existing) {
    throw createError('Colección no encontrada', 404);
  }

  await prisma.collectionItem.deleteMany({ where: { collectionId: id } });
  await prisma.collection.delete({ where: { id } });
}

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