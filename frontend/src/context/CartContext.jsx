import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "qa_demo_cart";

const readInitial = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  // Initialize synchronously from localStorage so save-effect never wipes storage
  const [items, setItems] = useState(readInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (_) {}
  }, [items]);

  const add = (product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          quantity: 1,
        },
      ];
    });
  };

  const remove = (productId) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  };

  const updateQty = (productId, quantity) => {
    if (quantity <= 0) return remove(productId);
    setItems((prev) =>
      prev.map((i) =>
        i.product_id === productId ? { ...i, quantity } : i
      )
    );
  };

  const clear = () => setItems([]);

  const count = items.reduce((acc, i) => acc + i.quantity, 0);
  const total = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const has = (productId) => items.some((i) => i.product_id === productId);

  return (
    <CartContext.Provider
      value={{ items, add, remove, updateQty, clear, count, total, has }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
