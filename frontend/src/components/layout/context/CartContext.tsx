import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { CartContext, CART_STORAGE_KEY } from './CartContextUtils';
import type { CartItem } from '../../../types';

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
        return prev.map((i) =>
          i.product.id === newItem.product.id
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        );
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
        i.product.id === productId ? { ...i, quantity } : i
      )
    );
  }, [removeFromCart]);

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