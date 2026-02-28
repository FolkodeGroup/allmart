// services/cartService.ts
import { prisma } from '../config/prisma';
import { createError } from '../middlewares/errorHandler';
import { CartDTO, CartItemDTO } from '../types/cart';

// ─── Helpers ──────────────────────────────────────────────

// Encuentra o crea un carrito según userId o sessionId
export async function findOrCreateCart(userId?: string, sessionId?: string) {
  if (!userId && !sessionId) {
    throw createError('Usuario o sessionId requerido', 400);
  }

  let cart = await prisma.cart.findFirst({
    where: { userId, sessionId },
    include: { cartItems: { include: { product: true } } },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId, sessionId },
      include: { cartItems: { include: { product: true } } },
    });
  }

  return cart;
}

// Convierte un cart de Prisma a CartDTO
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
    userId: cart.userId ?? undefined,
    sessionId: cart.sessionId ?? undefined,
    items,
    total,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}

// ─── Servicios ────────────────────────────────────────────

// Devuelve el carrito del usuario o session
export async function getCart(userId?: string, sessionId?: string): Promise<CartDTO> {
  const cart = await findOrCreateCart(userId, sessionId);
  return mapCartToDTO(cart);
}

// Agrega un producto al carrito o incrementa la cantidad
export async function addItem(
  userId: string | undefined,
  sessionId: string | undefined,
  productId: string,
  quantity: number = 1
): Promise<CartDTO> {
  const cart = await findOrCreateCart(userId, sessionId);

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

  return getCart(userId, sessionId);
}

// Actualiza la cantidad de un producto en el carrito
export async function updateItem(
  userId: string | undefined,
  sessionId: string | undefined,
  productId: string,
  quantity: number
): Promise<CartDTO> {
  if (quantity <= 0) {
    return removeItem(userId, sessionId, productId);
  }

  const cart = await findOrCreateCart(userId, sessionId);

  const item = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId },
  });

  if (!item) throw createError('Producto no encontrado en el carrito', 404);

  await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity },
  });

  return getCart(userId, sessionId);
}

// Elimina un producto del carrito
export async function removeItem(
  userId: string | undefined,
  sessionId: string | undefined,
  productId: string
): Promise<CartDTO> {
  const cart = await findOrCreateCart(userId, sessionId);

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id, productId },
  });

  return getCart(userId, sessionId);
}

// Vacía todo el carrito
export async function clearCart(userId: string | undefined, sessionId: string | undefined): Promise<CartDTO> {
  const cart = await findOrCreateCart(userId, sessionId);

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  return {
    id: cart.id,
    userId: cart.userId ?? undefined,
    sessionId: cart.sessionId ?? undefined,
    items: [],
    total: 0,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}