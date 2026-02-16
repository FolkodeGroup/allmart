import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface CartItem {
  id: string;
  quantity: number;
  // Agrega más campos según tu modelo de producto si es necesario
}

interface CartContextType {
  items: CartItem[];
  toggleCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items] = useState<CartItem[]>([]);

  const toggleCart = () => {};

  return (
    <CartContext.Provider value={{ items, toggleCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de un CartProvider');
  }
  return context;
};