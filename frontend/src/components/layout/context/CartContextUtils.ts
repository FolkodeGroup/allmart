import { useContext, createContext } from 'react';
import type { CartItem } from '../../../types';

export type { CartItem };

export const CART_STORAGE_KEY = 'allmart_cart';

export interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  toggleCart: () => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de un CartProvider');
  }
  return context;
};
