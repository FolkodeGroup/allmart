import { useContext } from 'react';
// ...existing code...

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de un CartProvider');
  }
  return context;
};
import { createContext } from 'react';

export interface CartItem {
  id: string;
  quantity: number;
}

export interface CartContextType {
  items: CartItem[];
  toggleCart: () => void;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);
