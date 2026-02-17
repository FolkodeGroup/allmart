
import { useState } from 'react';
import type { ReactNode } from 'react';
import { CartContext, CartItem } from './CartContextUtils';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items] = useState<CartItem[]>([]);

  const toggleCart = () => {};

  return (
    <CartContext.Provider value={{ items, toggleCart }}>
      {children}
    </CartContext.Provider>
  );
};


