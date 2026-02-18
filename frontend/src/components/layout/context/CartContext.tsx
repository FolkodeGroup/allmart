
import { useState } from 'react';
import type { ReactNode } from 'react';
import { CartContext } from './CartContextUtils';
import type { CartItem } from './CartContextUtils';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (newItem: CartItem) => {
    setItems((prevItems) => [...prevItems, newItem]);
  };
  
  const toggleCart = () => {};

  return (
    <CartContext.Provider value={{ items, toggleCart, addToCart }}>
      {children}
    </CartContext.Provider>
  );
};


