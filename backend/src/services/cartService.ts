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
    include: { cartItems: { include: { product: true } } },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { sessionId },
      include: { cartItems: { include: { product: true } } },
    });
  }

  return cart;
}

// Convierte un cart de Prisma a CartDTO (eliminando mapeos de userId)
function mapCartToDTO(cart: any): CartDTO {
  const items: CartItemDTO[] = cart.cartItems.map((ci: any) => ({
    productId: ci.productId,
    quantity: ci.quantity,
    productName: ci.product.name,
    productImage: ci.product.image ?? undefined,
    unitPrice: Number(ci.product.price),
  }));

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

// Agrega un producto al carrito o incrementa la cantidad usando session_id
export async function addItem(
  sessionId: string,
  productId: string,
  quantity: number = 1
): Promise<CartDTO> {
  const cart = await findOrCreateCart(sessionId);

  const existingItem = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId },
  });

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity },
    });
  }

  return getCart(sessionId);
}

// Actualiza la cantidad de un producto en el carrito
export async function updateItem(
  sessionId: string,
  productId: string,
  quantity: number
): Promise<CartDTO> {
  if (quantity <= 0) {
    return removeItem(sessionId, productId);
  }

  const cart = await findOrCreateCart(sessionId);

  const item = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId },
  });

  if (!item) throw createError('Producto no encontrado en el carrito', 404);

  await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity },
  });

  return getCart(sessionId);
}

// Elimina un producto del carrito
export async function removeItem(
  sessionId: string,
  productId: string
): Promise<CartDTO> {
  const cart = await findOrCreateCart(sessionId);

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id, productId },
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