// services/cartService.ts
import { prisma } from '../config/prisma';
import { createError } from '../middlewares/errorHandler';
import { CartDTO, CartItemDTO } from '../types/cart';
import * as discountService from './discountService';

// ─── Helpers ──────────────────────────────────────────────

// Encuentra o crea un carrito dependiendo exclusivamente del sessionId
export async function findOrCreateCart(sessionId: string) {
  if (!sessionId) {
    throw createError('sessionId requerido', 400);
  }

  let cart = await prisma.cart.findUnique({
    where: { sessionId },
    include: {
      cartItems: {
        include: {
          product: {
            include: {
              productImages: { select: { id: true }, orderBy: { position: 'asc' } },
            },
          },
          productSku: {
            include: {
              productSkuImages: { select: { id: true }, orderBy: { position: 'asc' } },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { sessionId },
      include: {
        cartItems: {
          include: {
            product: {
              include: {
                productImages: { select: { id: true }, orderBy: { position: 'asc' } },
              },
            },
            productSku: {
              include: {
                productSkuImages: { select: { id: true }, orderBy: { position: 'asc' } },
              },
            },
          },
        },
      },
    });
  }

  return cart;
}

// Convierte un cart de Prisma a CartDTO
async function mapCartToDTO(cart: any): Promise<CartDTO> {
  const items: CartItemDTO[] = [];

  let computedTotal = 0;

  for (const ci of cart.cartItems) {
    let unitPrice = Number(ci.product.price);
    let productImage = undefined;

    if (ci.productSku) {
      if (ci.productSku.price !== null && ci.productSku.price !== undefined) {
        unitPrice = Number(ci.productSku.price);
      }
      if (Array.isArray(ci.productSku.productSkuImages) && ci.productSku.productSkuImages.length > 0) {
        productImage = `/api/images/sku/${ci.productSku.productSkuImages[0].id}`;
      }
    }

    if (!productImage && Array.isArray(ci.product.productImages) && ci.product.productImages.length > 0) {
      productImage = `/api/images/products/${ci.product.productImages[0].id}`;
    }

    // Request best discount for the specific quantity in cart
    let appliedDiscount = null;
    try {
      appliedDiscount = await discountService.getBestDiscount(
        ci.productId,
        unitPrice,
        [],
        ci.quantity
      );
    } catch (err) {
      // ignore discount errors and proceed without discount
      appliedDiscount = null;
    }

    const itemTotal = appliedDiscount && appliedDiscount.totalFinalPrice !== undefined
      ? appliedDiscount.totalFinalPrice
      : unitPrice * ci.quantity;

    computedTotal += itemTotal;

    const itemDTO: CartItemDTO = {
      productId: ci.productId,
      productSkuId: ci.productSkuId ?? undefined,
      quantity: ci.quantity,
      productName: ci.product.name,
      productImage,
      unitPrice,
      appliedDiscount: appliedDiscount ?? null,
    } as any;

    items.push(itemDTO);
  }

  return {
    id: cart.id,
    sessionId: cart.sessionId ?? undefined,
    items,
    total: Math.round(computedTotal * 100) / 100,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}

// ─── Servicios ────────────────────────────────────────────

// Devuelve el carrito asociado a la sesión de la tienda
export async function getCart(sessionId: string): Promise<CartDTO> {
  const cart = await findOrCreateCart(sessionId);
  return mapCartToDTO(cart);
}

// Agrega un producto o variante al carrito o incrementa la cantidad usando session_id
export async function addItem(
  sessionId: string,
  productId: string,
  productSkuId: string | null,
  quantity: number = 1
): Promise<CartDTO> {
  const cart = await findOrCreateCart(sessionId);

  if (quantity <= 0) {
    throw createError('La cantidad a agregar debe ser mayor a cero', 400);
  }

  // Normalización preventiva de "original" o "null"
  const normalizedSkuId = (productSkuId && productSkuId !== 'original' && productSkuId !== 'null') ? productSkuId : null;

  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId,
      productSkuId: normalizedSkuId,
    },
  });

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        productSkuId: normalizedSkuId,
        quantity,
      },
    });
  }

  return getCart(sessionId);
}

// Actualiza la cantidad de un producto o variante en el carrito
export async function updateItem(
  sessionId: string,
  productId: string,
  productSkuId: string | null,
  quantity: number
): Promise<CartDTO> {
  if (quantity <= 0) {
    return removeItem(sessionId, productId, productSkuId);
  }

  const cart = await findOrCreateCart(sessionId);
  const normalizedSkuId = (productSkuId && productSkuId !== 'original' && productSkuId !== 'null') ? productSkuId : null;

  const item = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId,
      productSkuId: normalizedSkuId,
    },
  });

  if (!item) throw createError('Producto o variante no encontrado en el carrito', 404);

  await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity },
  });

  return getCart(sessionId);
}

// Elimina un producto o variante del carrito
export async function removeItem(
  sessionId: string,
  productId: string,
  productSkuId: string | null
): Promise<CartDTO> {
  const cart = await findOrCreateCart(sessionId);
  const normalizedSkuId = (productSkuId && productSkuId !== 'original' && productSkuId !== 'null') ? productSkuId : null;

  await prisma.cartItem.deleteMany({
    where: {
      cartId: cart.id,
      productId,
      productSkuId: normalizedSkuId,
    },
  });

  return getCart(sessionId);
}

// Vacía todo el carrito por completo
export async function clearCart(sessionId: string): Promise<CartDTO> {
  const cart = await findOrCreateCart(sessionId);

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  return {
    id: cart.id,
    sessionId: cart.sessionId ?? undefined,
    items: [],
    total: 0,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}