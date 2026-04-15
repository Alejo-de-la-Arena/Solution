import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getPublicProducts } from '../services/products';
import { trackAddToCart } from '../lib/metaPixel';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  /** Precios del carrito persisten en localStorage; al cambiar precios en Supabase hay que alinearlos. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await getPublicProducts();
        if (cancelled || !rows?.length) return;
        const bySlug = new Map(rows.map((r) => [r.slug, Number(r.price_retail) || 0]));
        setCart((prev) => {
          let changed = false;
          const next = prev.map((item) => {
            const fresh = bySlug.get(item.id);
            if (fresh === undefined) return item;
            if (Number(item.price) === fresh) return item;
            changed = true;
            return { ...item, price: fresh };
          });
          return changed ? next : prev;
        });
      } catch {
        /* offline o error de red: se mantiene el carrito guardado */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
    setIsOpen(true);

    // Track AddToCart con datos del producto (fuera de setCart para no doblar en StrictMode)
    trackAddToCart({
      id: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      quantity,
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item =>
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  const clearCart = useCallback(() => setCart([]), []);
  const toggleCart = () => setIsOpen(prev => !prev);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      isOpen,
      setIsOpen,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      toggleCart,
      totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
