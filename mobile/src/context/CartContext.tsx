import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProductData } from '../services/api';

export interface CartItem {
  product: ProductData;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: ProductData, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem('@artisan_cart').then(data => {
      if (data) {
        try {
          setCart(JSON.parse(data));
        } catch (e) {
          console.error('Failed to parse cart', e);
        }
      }
    });
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    AsyncStorage.setItem('@artisan_cart', JSON.stringify(newCart));
  };

  const addToCart = (product: ProductData, quantity = 1) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      saveCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item));
    } else {
      saveCart([...cart, { product, quantity }]);
    }
  };

  const removeFromCart = (productId: string) => {
    saveCart(cart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      saveCart(cart.map(item => item.product.id === productId ? { ...item, quantity } : item));
    }
  };

  const clearCart = () => {
    saveCart([]);
  };

  const cartTotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
