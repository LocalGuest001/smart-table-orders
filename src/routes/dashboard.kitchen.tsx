import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveMembership } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatPrice } from "@/lib/types";
import { Clock, ChefHat, Check } from "lucide-react";

export const Route = createFileRoute("/dashboard/kitchen")({ component: KitchenPage });

type OrderStatus = "pending" | "accepted" | "preparing" | "completed" | "cancelled";
type Order = {
  id: string;
  status: OrderStatus;
  notes: string | null;
  total: number;
  created_at: string;
  table: { name: string } | null;
  order_items: { id: string; name: string; quantity: number; variant: string | null; notes: string | null }[];
};

const ACTIVE: OrderStatus[] = ["pending", "accepted", "preparing"];

function KitchenPage() {
  const active = useActiveMembership();
  const restaurantId = active?.restaurant.id;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!restaurantId) return;
    const { data, error } = await supabase
      .from("orders")
      .select("id, status, notes, total, created_at, table:restaurant_tables(name), order_items(id, name, quantity, variant, notes)")
      .eq("restaurant_id", restaurantId)
      .in("status", ACTIVE)
      .order("created_at", { ascending: true });
    if (error) toast.error(error.message);
    else setOrders((data ?? []) as unknown as Order[]);
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    void load();
    if (!restaurantId) return;
    const channel = supabase
      .channel(`kitchen-${restaurantId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` }, () => {
        void load();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => {
        void load();
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [restaurantId, load]);

  const setStatus = async (id: string, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
  };

  const groups = {
    pending: orders.filter((o) => o.status === "pending"),
    preparing: orders.filter((o) => o.status === "preparing" || o.status === "accepted"),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Kitchen</h1>
        <p className="mt-1 text-muted-foreground">Live tickets. Updates in real time.</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center">
          <ChefHat className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-display text-xl font-semibold">All caught up</h3>
          <p className="mt-1 text-sm text-muted-foreground">No active orders right now.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Column title="New" tone="warning" orders={groups.pending}>
            {(o) => (
              <Button size="sm" className="w-full" onClick={() => setStatus(o.id, "preparing")}>
                <ChefHat className="mr-2 h-4 w-4" /> Start preparing
              </Button>
            )}
          </Column>
          <Column title="Preparing" tone="primary" orders={groups.preparing}>
            {(o) => (
              <Button size="sm" variant="default" className="w-full bg-success text-success-foreground hover:opacity-90" onClick={() => setStatus(o.id, "completed")}>
                <Check className="mr-2 h-4 w-4" /> Mark done
              </Button>
            )}
          </Column>
        </div>
      )}
    </div>
  );
}

function Column({
  title, tone, orders, children,
}: {
  title: string;
  tone: "warning" | "primary";
  orders: Order[];
  children: (o: Order) => React.ReactNode;
}) {
  const dot = tone === "warning" ? "bg-warning" : "bg-primary";
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <span className="text-sm text-muted-foreground">({orders.length})</span>
      </div>
      <div className="space-y-3">
        {orders.length === 0 && <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">Empty</p>}
        {orders.map((o) => <OrderCard key={o.id} order={o}>{children(o)}</OrderCard>)}
      </div>
    </div>
  );
}

function OrderCard({ order, children }: { order: Order; children: React.ReactNode }) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000));
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold">{order.table?.name ?? "Walk-in"}</p>
          <p className="text-xs text-muted-foreground">#{order.id.slice(0, 8)}</p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs">
          <Clock className="h-3 w-3" /> {minutes}m
        </div>
      </div>
      <ul className="mt-3 space-y-1.5 text-sm">
        {order.order_items.map((it) => (
          <li key={it.id} className="flex justify-between gap-2">
            <span><span className="font-semibold">{it.quantity}×</span> {it.name}{it.variant ? ` · ${it.variant}` : ""}</span>
          </li>
        ))}
      </ul>
      {order.notes && (
        <p className="mt-3 rounded-md bg-warning/10 p-2 text-xs italic text-foreground">📝 {order.notes}</p>
      )}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm font-semibold">{formatPrice(Number(order.total))}</span>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
