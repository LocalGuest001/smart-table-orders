import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveMembership } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/types";

export const Route = createFileRoute("/dashboard/menu")({ component: MenuPage });

type Category = { id: string; name: string; sort_order: number };
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

function MenuPage() {
  const active = useActiveMembership();
  const restaurantId = active?.restaurant.id;
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    const [c, i] = await Promise.all([
      supabase.from("menu_categories").select("*").eq("restaurant_id", restaurantId).order("sort_order"),
      supabase.from("menu_items").select("*").eq("restaurant_id", restaurantId).order("sort_order"),
    ]);
    setCategories((c.data ?? []) as Category[]);
    setItems((i.data ?? []) as Item[]);
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => { void load(); }, [load]);

  if (!restaurantId) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Menu</h1>
          <p className="mt-1 text-muted-foreground">Manage categories, items, prices, and availability.</p>
        </div>
        <div className="flex gap-2">
          <CategoryDialog restaurantId={restaurantId} onSaved={load} />
          <ItemDialog restaurantId={restaurantId} categories={categories} onSaved={load} />
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : categories.length === 0 ? (
        <EmptyState
          title="Add your first category"
          body="Group your menu items — Starters, Mains, Drinks, etc."
        />
      ) : (
        <div className="space-y-8">
          {categories.map((cat) => {
            const catItems = items.filter((i) => i.category_id === cat.id);
            return (
              <section key={cat.id}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display text-xl font-semibold">{cat.name}</h2>
                  <CategoryDialog restaurantId={restaurantId} category={cat} onSaved={load} />
                </div>
                {catItems.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
                    No items in this category yet.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {catItems.map((it) => (
                      <ItemCard key={it.id} item={it} categories={categories} restaurantId={restaurantId} onChanged={load} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}

          {/* Uncategorized */}
          {items.some((i) => !i.category_id) && (
            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-muted-foreground">Uncategorized</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.filter((i) => !i.category_id).map((it) => (
                  <ItemCard key={it.id} item={it} categories={categories} restaurantId={restaurantId} onChanged={load} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function ItemCard({ item, categories, restaurantId, onChanged }: { item: Item; categories: Category[]; restaurantId: string; onChanged: () => void }) {
  const toggleAvail = async () => {
    const { error } = await supabase.from("menu_items").update({ is_available: !item.is_available }).eq("id", item.id);
    if (error) toast.error(error.message); else onChanged();
  };
  const del = async () => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", item.id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); onChanged(); }
  };
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{item.name}</h3>
          {item.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>}
          <p className="mt-2 font-display text-lg font-semibold text-primary">{formatPrice(Number(item.price))}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Switch checked={item.is_available} onCheckedChange={toggleAvail} />
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{item.is_available ? "Live" : "Hidden"}</span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <ItemDialog restaurantId={restaurantId} categories={categories} item={item} onSaved={onChanged} />
        <Button size="sm" variant="ghost" onClick={del}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function CategoryDialog({ restaurantId, category, onSaved }: { restaurantId: string; category?: Category; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(category?.name ?? "");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    if (category) {
      const { error } = await supabase.from("menu_categories").update({ name }).eq("id", category.id);
      if (error) { toast.error(error.message); setBusy(false); return; }
    } else {
      const { error } = await supabase.from("menu_categories").insert({ restaurant_id: restaurantId, name });
      if (error) { toast.error(error.message); setBusy(false); return; }
    }
    setBusy(false);
    setOpen(false);
    setName("");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {category ? (
          <Button size="sm" variant="ghost"><Pencil className="h-4 w-4" /></Button>
        ) : (
          <Button size="sm" variant="outline"><Plus className="mr-1 h-4 w-4" /> Category</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{category ? "Edit category" : "New category"}</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Starters, Mains, Drinks…" />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ItemDialog({ restaurantId, categories, item, onSaved }: { restaurantId: string; categories: Category[]; item?: Item; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: item?.name ?? "",
    description: item?.description ?? "",
    price: item?.price?.toString() ?? "",
    image_url: item?.image_url ?? "",
    allergens: (item?.allergens ?? []).join(", "),
    category_id: item?.category_id ?? (categories[0]?.id ?? ""),
    is_available: item?.is_available ?? true,
  });
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!form.name.trim() || !form.price) { toast.error("Name and price required"); return; }
    setBusy(true);
    const payload = {
      restaurant_id: restaurantId,
      category_id: form.category_id || null,
      name: form.name,
      description: form.description || null,
      price: Number(form.price),
      image_url: form.image_url || null,
      allergens: form.allergens.split(",").map((s) => s.trim()).filter(Boolean),
      is_available: form.is_available,
    };
    const { error } = item
      ? await supabase.from("menu_items").update(payload).eq("id", item.id)
      : await supabase.from("menu_items").insert(payload);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(item ? "Updated" : "Item added");
    setOpen(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {item ? (
          <Button size="sm" variant="outline"><Pencil className="mr-1 h-4 w-4" /> Edit</Button>
        ) : (
          <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Item</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{item ? "Edit item" : "New menu item"}</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Price</Label>
              <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Image URL (optional)</Label>
            <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://…" />
          </div>
          <div className="space-y-2">
            <Label>Allergens (comma-separated)</Label>
            <Input value={form.allergens} onChange={(e) => setForm({ ...form, allergens: e.target.value })} placeholder="gluten, dairy, nuts" />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.is_available} onCheckedChange={(v) => setForm({ ...form, is_available: v })} />
            <Label>Available to customers</Label>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
