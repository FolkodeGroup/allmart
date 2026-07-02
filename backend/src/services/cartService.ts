// services/cartService.ts
import { prisma } from '../config/prisma';
import { createError } from '../middlewares/errorHandler';
import { CartDTO, CartItemDTO } from '../types/cart';

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
function mapCartToDTO(cart: any): CartDTO {
  const items: CartItemDTO[] = cart.cartItems.map((ci: any) => {
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

    return {
      productId: ci.productId,
      productSkuId: ci.productSkuId ?? undefined,
      quantity: ci.quantity,
      productName: ci.product.name,
      productImage,
      unitPrice,
    };
  });

  const total = items.reduce((sum, item) => sum + item.quantity * (item.unitPrice ?? 0), 0);

  return {
    id: cart.id,
    sessionId: cart.sessionId ?? undefined,
    items,
    total,
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

  const existingItem = await prisma.cartItem.findFirst({
    where: { 
      cartId: cart.id, 
      productId,
      productSkuId: productSkuId ?? null,
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
        productSkuId: productSkuId ?? null,
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

  const item = await prisma.cartItem.findFirst({
    where: { 
      cartId: cart.id, 
      productId,
      productSkuId: productSkuId ?? null,
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

  await prisma.cartItem.deleteMany({
    where: { 
      cartId: cart.id, 
      productId,
      productSkuId: productSkuId ?? null,
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