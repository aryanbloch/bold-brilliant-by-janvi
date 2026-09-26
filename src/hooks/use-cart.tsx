// Shopping basket shared across the site. Saved in the browser so it survives page reloads.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = { name: string; price: number; img: string; qty: number };

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  add: (item: Omit<CartItem, "qty">) => void;
  setQty: (name: string, qty: number) => void;
  remove: (name: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "bb-cart";
const CartContext = createContext<CartContextValue | null>(null);

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.name === "string" && typeof v.price === "number" && typeof v.img === "string" && typeof v.qty === "number";
}

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage can be unavailable (private mode) - the basket still works for this visit.
    }
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const setQty = (name: string, qty: number) =>
      setItems((prev) => (qty <= 0 ? prev.filter((i) => i.name !== name) : prev.map((i) => (i.name === name ? { ...i, qty } : i))));
    return {
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      total: items.reduce((n, i) => n + i.qty * i.price, 0),
      add: (item) =>
        setItems((prev) => {
          const existing = prev.find((i) => i.name === item.name);
          return existing ? prev.map((i) => (i.name === item.name ? { ...i, qty: i.qty + 1 } : i)) : [...prev, { ...item, qty: 1 }];
        }),
      setQty,
      remove: (name) => setQty(name, 0),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
