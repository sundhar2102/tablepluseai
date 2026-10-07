import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('tp_cart');
      return saved ? JSON.parse(saved) : { restaurant: null, table: null, items: [], specialNote: '' };
    } catch {
      return { restaurant: null, table: null, items: [], specialNote: '' };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('tp_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cart]);

  const addToCart = (item, restaurant, table = null) => {
    setCart((prev) => {
      // If adding from a different restaurant, prompt/reset cart for new restaurant
      const isDiffRest = prev.restaurant && prev.restaurant.id !== restaurant.id;
      const baseItems = isDiffRest ? [] : prev.items;

      const existingIndex = baseItems.findIndex((i) => i.id === item.id);
      let updatedItems;

      if (existingIndex > -1) {
        updatedItems = baseItems.map((i, idx) =>
          idx === existingIndex ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        updatedItems = [
          ...baseItems,
          {
            id: item.id,
            name: item.name,
            price: parseFloat(item.price),
            isVegetarian: item.is_vegetarian,
            photoUrl: item.photo_url,
            quantity: 1,
          },
        ];
      }

      return {
        restaurant,
        table: table || (isDiffRest ? null : prev.table),
        items: updatedItems,
        specialNote: isDiffRest ? '' : prev.specialNote,
      };
    });
  };

  const updateQuantity = (itemId, delta) => {
    setCart((prev) => {
      const updated = prev.items
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);

      return {
        ...prev,
        items: updated,
        restaurant: updated.length === 0 ? null : prev.restaurant,
        table: updated.length === 0 ? null : prev.table,
      };
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => {
      const updated = prev.items.filter((item) => item.id !== itemId);
      return {
        ...prev,
        items: updated,
        restaurant: updated.length === 0 ? null : prev.restaurant,
        table: updated.length === 0 ? null : prev.table,
      };
    });
  };

  const setTable = (table) => {
    setCart((prev) => ({ ...prev, table }));
  };

  const setSpecialNote = (specialNote) => {
    setCart((prev) => ({ ...prev, specialNote }));
  };

  const clearCart = () => {
    setCart({ restaurant: null, table: null, items: [], specialNote: '' });
    localStorage.removeItem('tp_cart');
  };

  const itemCount = cart.items.reduce((acc, curr) => acc + curr.quantity, 0);
  const subtotal = cart.items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        setTable,
        setSpecialNote,
        clearCart,
        itemCount,
        subtotal,
        tax,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
