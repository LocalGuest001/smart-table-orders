export type CartItem = {
  menu_item_id: string;
  name: string;
  unit_price: number;
  variant: string | null;
  quantity: number;
};

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export type FoodType = "veg" | "non_veg" | "jain";

export const FOOD_TYPE_LABEL: Record<FoodType, string> = {
  veg: "Veg",
  non_veg: "Non-veg",
  jain: "Jain",
};

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
