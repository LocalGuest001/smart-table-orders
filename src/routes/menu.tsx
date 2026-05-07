import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/menu")({
  component: MenuPreview,
});

type RestaurantOption = {
  id: string;
  name: string;
  slug: string;
  tables: { id: string; name: string }[];
};

function MenuPreview() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: rests } = await supabase
        .from("restaurants")
        .select("id, name, slug")
        .order("created_at", { ascending: true })
        .limit(20);
      const ids = (rests ?? []).map((r) => r.id);
      let tables: { id: string; name: string; restaurant_id: string }[] = [];
      if (ids.length) {
        const { data: t } = await supabase
          .from("restaurant_tables")
          .select("id, name, restaurant_id")
          .in("restaurant_id", ids);
        tables = t ?? [];
      }
      const opts: RestaurantOption[] = (rests ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        tables: tables.filter((tt) => tt.restaurant_id === r.id).map((tt) => ({ id: tt.id, name: tt.name })),
      }));
      setRestaurants(opts);
      // Auto-jump if exactly one restaurant + one table
      if (opts.length === 1 && opts[0].tables.length >= 1) {
        navigate({
          to: "/m/$slug/$tableId",
          params: { slug: opts[0].slug, tableId: opts[0].tables[0].id },
          replace: true,
        });
        return;
      }
      setLoading(false);
    })();
  }, [navigate]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-3xl font-semibold">Customer menu preview</h1>
      <p className="mt-2 text-muted-foreground">
        The customer menu opens when a guest scans a table QR code. No login required.
        Pick a restaurant and table below to preview the experience.
      </p>

      {restaurants.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">No restaurants yet.</p>
          <Button asChild className="mt-4"><Link to="/signup">Create a restaurant</Link></Button>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {restaurants.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-display text-xl font-semibold">{r.name}</h2>
              <p className="text-xs text-muted-foreground">/{r.slug}</p>
              {r.tables.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No tables configured.</p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.tables.map((t) => (
                    <Button key={t.id} variant="secondary" size="sm" asChild>
                      <Link to="/m/$slug/$tableId" params={{ slug: r.slug, tableId: t.id }}>
                        Open {t.name}
                      </Link>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
