import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveMembership } from "@/lib/auth-context";
import { UtensilsCrossed, QrCode, ChefHat, Receipt } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

function Overview() {
  const active = useActiveMembership();
  const restaurantId = active?.restaurant.id;
  const [stats, setStats] = useState({ items: 0, tables: 0, pending: 0, today: 0 });

  useEffect(() => {
    if (!restaurantId) return;
    (async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [items, tables, pending, todayOrders] = await Promise.all([
        supabase.from("menu_items").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurantId),
        supabase.from("restaurant_tables").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurantId),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurantId).eq("status", "pending"),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurantId).gte("created_at", today.toISOString()),
      ]);
      setStats({
        items: items.count ?? 0,
        tables: tables.count ?? 0,
        pending: pending.count ?? 0,
        today: todayOrders.count ?? 0,
      });
    })();
  }, [restaurantId]);

  const cards = [
    { icon: UtensilsCrossed, label: "Menu items", value: stats.items, to: "/dashboard/menu" },
    { icon: QrCode, label: "Tables", value: stats.tables, to: "/dashboard/tables" },
    { icon: ChefHat, label: "Pending orders", value: stats.pending, to: "/dashboard/kitchen" },
    { icon: Receipt, label: "Orders today", value: stats.today, to: "/dashboard/kitchen" },
  ] as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Welcome back 👋</h1>
        <p className="mt-1 text-muted-foreground">Here's how {active?.restaurant.name} is doing today.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="group rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <c.icon className="h-5 w-5" />
              </div>
              <span className="font-display text-3xl font-semibold">{c.value}</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-semibold">Quick start</h2>
        <ol className="mt-4 space-y-3 text-sm">
          <li className="flex gap-3"><span className="font-semibold text-primary">1.</span> Add menu categories and items in <Link to="/dashboard/menu" className="text-primary hover:underline">Menu</Link>.</li>
          <li className="flex gap-3"><span className="font-semibold text-primary">2.</span> Create your tables and print QR codes in <Link to="/dashboard/tables" className="text-primary hover:underline">Tables & QR</Link>.</li>
          <li className="flex gap-3"><span className="font-semibold text-primary">3.</span> Watch incoming orders in the <Link to="/dashboard/kitchen" className="text-primary hover:underline">Kitchen</Link> view.</li>
        </ol>
      </div>
    </div>
  );
}
