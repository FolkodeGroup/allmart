import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { CartContext, CART_STORAGE_KEY } from './CartContextUtils';
import type { CartItem, Discount } from '../../../types';
import { publicCollectionsService } from '../../../services/publicCollectionsService';

function extractProductId(compositeId: string): string {
  return compositeId.split('::')[0];
}

function calculateDiscountForQuantity(
  discount: Discount | null | undefined,
  quantity: number
): Discount | null {
  if (!discount || quantity <= 0) {
    return discount ?? null;
  }

  if (discount.promotionType !== 'bogo') {
    return discount;
  }
  if (quantity <= 0) {
    return discount;
  }

  if (discount.promotionType !== 'bogo') {
    return discount;
  }

  const originalPrice = discount.originalPrice;
  const freeItems = quantity >= 2 ? Math.floor(quantity / 2) : 0;
  const totalFinalPrice = originalPrice * (quantity - freeItems);
  const finalPrice = Math.round((totalFinalPrice / quantity) * 100) / 100;
  const discountAmount = Math.round((originalPrice - finalPrice) * 100) / 100;
  const totalDiscountAmount = Math.round(discountAmount * quantity * 100) / 100;
  const totalOriginalPrice = Math.round(originalPrice * quantity * 100) / 100;
  const discountPercentage = totalOriginalPrice > 0
    ? Math.round((totalDiscountAmount / totalOriginalPrice) * 100) / 100
    : 0;

  return {
    ...discount,
    finalPrice,
    discountAmount,
    discountPercentage,
  };
}

function mergeDiscounts(
  existingDiscount: Discount | null | undefined,
  newDiscount: Discount | null | undefined,
  quantity: number
): Discount | null {
  const discount = newDiscount ?? existingDiscount;
  if (!discount) return null;
  return calculateDiscountForQuantity(discount, quantity);
}

/* ── Helpers de localStorage ── */
function loadCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveCartToStorage(items: CartItem[]): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // cuota excedida o modo privado sin almacenamiento
  }
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(loadCartFromStorage);

  /* Persiste en localStorage cada vez que el carrito cambia */
  useEffect(() => {
    saveCartToStorage(items);
  }, [items]);

  // 🚀 OPTIMIZACIÓN: Memoizamos todas las funciones
  const addToCart = useCallback((newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === newItem.product.id);
      if (existing) {
        const newQuantity = existing.quantity + newItem.quantity;
        const mergedDiscount = mergeDiscounts(existing.discount, newItem.discount, newQuantity);

        const updatedItems = prev.map((i) =>
          i.product.id === newItem.product.id
            ? { ...i, quantity: newQuantity, discount: mergedDiscount }
            : i
        );

        if (mergedDiscount === null) {
          resolveCartItemDiscount(existing, newQuantity).then((discount) => {
            setItems((currentItems) =>
              currentItems.map((item) =>
                item.product.id === existing.product.id && item.quantity === newQuantity
                  ? { ...item, discount }
                  : item
              )
            );
          }).catch(() => {
            // ignore network errors, keep the current discount state
          });
        }

        return updatedItems;
      }
      return [...prev, newItem];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId
          ? { ...i, quantity, discount: calculateDiscountForQuantity(i.discount ?? null, quantity) }
          : i
      )
    );

    const currentItem = items.find((item) => item.product.id === productId);
    if (!currentItem) return;

    resolveCartItemDiscount(currentItem, quantity).then((discount) => {
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.product.id === productId && item.quantity === quantity
            ? { ...item, discount }
            : item
        )
      );
    }).catch(() => {
      // ignore network or validation errors
    });
  }, [removeFromCart, items]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const toggleCart = useCallback(() => {}, []);

  // 🚀 OPTIMIZACIÓN: Memoizamos los cálculos pesados
  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  
  const totalPrice = useMemo(() => items.reduce((sum, i) => {
    const unitPrice = i.discount?.finalPrice ?? i.product.price;
    return sum + unitPrice * i.quantity;
  }, 0), [items]);

  async function resolveCartItemDiscount(item: CartItem, quantity: number): Promise<Discount | null> {
    const baseProductId = extractProductId(item.product.id);
    const categoryIds = Array.isArray(item.product.categoryIds)
      ? item.product.categoryIds
      : item.product.categoryId
        ? [item.product.categoryId]
        : [];

    return await publicCollectionsService.getProductDiscount(
      baseProductId,
      item.product.price,
      categoryIds,
      quantity
    );
  }

  // 🚀 OPTIMIZACIÓN: Memoizamos el objeto final del Provider
  const contextValue = useMemo(() => ({
    items,
    totalItems,
    totalPrice,
    toggleCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  }), [
    items,
    totalItems,
    totalPrice,
    toggleCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  ]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};