import { useEffect, useState } from "react";
import type { CartItem } from "./types";

const KEY = (slug: string, tableId: string) => `sm_cart_${slug}_${tableId}`;

export function useCart(slug: string, tableId: string) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(KEY(slug, tableId));
    if (raw) {
      try {
        setItems(JSON.parse(raw));
      } catch {
        // ignore
      }
    }
  }, [slug, tableId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY(slug, tableId), JSON.stringify(items));
  }, [items, slug, tableId]);

  const add = (item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const i = prev.findIndex((p) => p.menu_item_id === item.menu_item_id && p.variant === item.variant);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], quantity: next[i].quantity + 1 };
        return next;
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const setQty = (menu_item_id: string, variant: string | null, qty: number) => {
    setItems((prev) =>
      prev
        .map((p) => (p.menu_item_id === menu_item_id && p.variant === variant ? { ...p, quantity: qty } : p))
        .filter((p) => p.quantity > 0)
    );
  };

  const clear = () => setItems([]);

  const total = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return { items, add, setQty, clear, total, count };
}
