export type CartItem = {
  menu_item_id: string;
  name: string;
  unit_price: number;
  variant: string | null;
  quantity: number;
};

export const formatPrice = (n: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
