import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingBag, Plus, Minus, Check } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatPrice, FOOD_TYPE_LABEL, type FoodType } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/m/$slug/$tableId")({
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: CustomerMenu,
});

type Restaurant = { id: string; name: string; logo_url: string | null; theme_color: string | null };
type Category = { id: string; name: string };
type Item = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  allergens: string[] | null;
  is_available: boolean;
};

function CustomerMenu() {
  const { slug, tableId } = Route.useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [tableName, setTableName] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const cart = useCart(slug, tableId);

  useEffect(() => {
    (async () => {
      const { data: rest } = await supabase
        .from("restaurants")
        .select("id, name, logo_url, theme_color")
        .eq("slug", slug)
        .maybeSingle();
      if (!rest) { setNotFound(true); setLoading(false); return; }
      setRestaurant(rest);

      const { data: t } = await supabase
        .from("restaurant_tables")
        .select("name, restaurant_id")
        .eq("id", tableId)
        .maybeSingle();
      if (!t || t.restaurant_id !== rest.id) { setNotFound(true); setLoading(false); return; }
      setTableName(t.name);

      const [c, i] = await Promise.all([
        supabase.from("menu_categories").select("id, name").eq("restaurant_id", rest.id).order("sort_order"),
        supabase.from("menu_items").select("*").eq("restaurant_id", rest.id).eq("is_available", true).order("sort_order"),
      ]);
      setCategories((c.data ?? []) as Category[]);
      setItems((i.data ?? []) as Item[]);
      setLoading(false);
    })();
  }, [slug, tableId]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading menu…</div>;
  }
  if (notFound || !restaurant) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <div>
          <h1 className="font-display text-3xl font-semibold">Menu not available</h1>
          <p className="mt-2 text-muted-foreground">This QR code may be invalid or the restaurant has changed.</p>
        </div>
      </div>
    );
  }

  const themeStyle = restaurant.theme_color
    ? ({ ["--brand" as string]: restaurant.theme_color } as React.CSSProperties)
    : undefined;

  const placeOrder = async (notes: string) => {
    if (cart.items.length === 0) return;
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        restaurant_id: restaurant.id,
        table_id: tableId,
        status: "pending",
        notes: notes || null,
        total: cart.total,
      })
      .select()
      .single();
    if (error || !order) { toast.error(error?.message ?? "Could not place order"); return; }

    const items_payload = cart.items.map((i) => ({
      order_id: order.id,
      menu_item_id: i.menu_item_id,
      name: i.name,
      unit_price: i.unit_price,
      quantity: i.quantity,
      variant: i.variant,
    }));
    const { error: ie } = await supabase.from("order_items").insert(items_payload);
    if (ie) { toast.error(ie.message); return; }
    cart.clear();
    navigate({ to: "/m/$slug/$tableId/thanks", params: { slug, tableId }, search: { order: order.id } });
  };

  return (
    <div className="min-h-screen bg-background pb-28" style={themeStyle}>
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
          {restaurant.logo_url ? (
            <img src={restaurant.logo_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
              <span className="font-display text-lg font-semibold">{restaurant.name.charAt(0)}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-semibold leading-tight">{restaurant.name}</h1>
            <p className="text-xs text-muted-foreground">Ordering for {tableName}</p>
          </div>
        </div>
      </header>

      {/* Categories scroll */}
      {categories.length > 0 && (
        <div className="sticky top-0 z-20 overflow-x-auto border-b border-border bg-background/95 px-4 py-2 backdrop-blur">
          <div className="mx-auto flex max-w-2xl gap-2">
            {categories.map((c) => (
              <a key={c.id} href={`#cat-${c.id}`} className="whitespace-nowrap rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:bg-accent">
                {c.name}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Menu */}
      <main className="mx-auto max-w-2xl px-4 py-6">
        {categories.length === 0 && items.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            This menu is being prepared. Please check back soon.
          </p>
        )}
        {categories.map((cat) => {
          const catItems = items.filter((i) => i.category_id === cat.id);
          if (catItems.length === 0) return null;
          return (
            <section key={cat.id} id={`cat-${cat.id}`} className="mb-8 scroll-mt-20">
              <h2 className="mb-3 font-display text-2xl font-semibold">{cat.name}</h2>
              <div className="space-y-3">
                {catItems.map((it) => <MenuItemCard key={it.id} item={it} cart={cart} />)}
              </div>
            </section>
          );
        })}
        {items.some((i) => !i.category_id) && (
          <section className="mb-8">
            <h2 className="mb-3 font-display text-2xl font-semibold">More</h2>
            <div className="space-y-3">
              {items.filter((i) => !i.category_id).map((it) => <MenuItemCard key={it.id} item={it} cart={cart} />)}
            </div>
          </section>
        )}
      </main>

      {/* Cart bar */}
      {cart.count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 p-3 backdrop-blur">
          <div className="mx-auto max-w-2xl">
            <Sheet>
              <SheetTrigger asChild>
                <Button className="h-14 w-full justify-between text-base shadow-elegant">
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" /> View cart · {cart.count} item{cart.count !== 1 ? "s" : ""}
                  </span>
                  <span>{formatPrice(cart.total)}</span>
                </Button>
              </SheetTrigger>
              <CartSheet cart={cart} onPlace={placeOrder} tableName={tableName ?? ""} />
            </Sheet>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItemCard({ item, cart }: { item: Item; cart: ReturnType<typeof useCart> }) {
  const inCart = cart.items.find((c) => c.menu_item_id === item.id && c.variant === null);
  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-card p-3">
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold leading-tight">{item.name}</h3>
        {item.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>}
        {item.allergens && item.allergens.length > 0 && (
          <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">Contains: {item.allergens.join(", ")}</p>
        )}
        <p className="mt-2 font-display text-lg font-semibold text-primary">{formatPrice(Number(item.price))}</p>
      </div>
      <div className="flex flex-col items-end justify-between gap-2">
        {item.image_url && (
          <img src={item.image_url} alt="" className="h-20 w-20 rounded-xl object-cover" loading="lazy" />
        )}
        {inCart ? (
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-2 py-1">
            <button onClick={() => cart.setQty(item.id, null, inCart.quantity - 1)} className="flex h-6 w-6 items-center justify-center rounded-full bg-card"><Minus className="h-3 w-3" /></button>
            <span className="w-5 text-center text-sm font-semibold">{inCart.quantity}</span>
            <button onClick={() => cart.setQty(item.id, null, inCart.quantity + 1)} className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"><Plus className="h-3 w-3" /></button>
          </div>
        ) : (
          <Button size="sm" onClick={() => cart.add({ menu_item_id: item.id, name: item.name, unit_price: Number(item.price), variant: null })}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        )}
      </div>
    </div>
  );
}

function CartSheet({ cart, onPlace, tableName }: { cart: ReturnType<typeof useCart>; onPlace: (notes: string) => Promise<void>; tableName: string }) {
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);

  const place = async () => {
    setPlacing(true);
    await onPlace(notes);
    setPlacing(false);
  };

  return (
    <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
      <SheetHeader>
        <SheetTitle>Your order · {tableName}</SheetTitle>
      </SheetHeader>
      <div className="mt-4 space-y-3">
        {cart.items.map((i) => (
          <div key={i.menu_item_id + (i.variant ?? "")} className="flex items-center gap-3 rounded-xl border border-border p-3">
            <div className="flex-1">
              <p className="font-semibold">{i.name}</p>
              <p className="text-sm text-muted-foreground">{formatPrice(i.unit_price)}</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-secondary px-2 py-1">
              <button onClick={() => cart.setQty(i.menu_item_id, i.variant, i.quantity - 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-card"><Minus className="h-3 w-3" /></button>
              <span className="w-5 text-center text-sm font-semibold">{i.quantity}</span>
              <button onClick={() => cart.setQty(i.menu_item_id, i.variant, i.quantity + 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground"><Plus className="h-3 w-3" /></button>
            </div>
            <p className="w-16 text-right font-semibold">{formatPrice(i.unit_price * i.quantity)}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        <label className="text-sm font-medium">Notes for the kitchen (optional)</label>
        <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, spice level…" />
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="font-display text-2xl font-semibold">{formatPrice(cart.total)}</span>
      </div>
      <Button className="mt-4 w-full shadow-elegant" size="lg" onClick={place} disabled={placing}>
        <Check className="mr-2 h-4 w-4" /> {placing ? "Placing…" : "Place order"}
      </Button>
    </SheetContent>
  );
}
