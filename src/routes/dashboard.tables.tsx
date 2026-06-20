import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveMembership } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Printer } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard/tables")({ component: TablesPage });

type RTable = { id: string; name: string };

function TablesPage() {
  const active = useActiveMembership();
  const restaurantId = active?.restaurant.id;
  const slug = active?.restaurant.slug;
  const [tables, setTables] = useState<RTable[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [qrTable, setQrTable] = useState<RTable | null>(null);

  const load = useCallback(async () => {
    if (!restaurantId) return;
    const { data, error } = await supabase
      .from("restaurant_tables")
      .select("id, name")
      .eq("restaurant_id", restaurantId)
      .order("created_at");
    if (error) toast.error(error.message);
    else setTables((data ?? []) as RTable[]);
  }, [restaurantId]);

  useEffect(() => { void load(); }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId || !name.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("restaurant_tables").insert({ restaurant_id: restaurantId, name });
    setBusy(false);
    if (error) toast.error(error.message);
    else { setName(""); load(); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this table?")) return;
    const { error } = await supabase.from("restaurant_tables").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Tables & QR</h1>
        <p className="mt-1 text-muted-foreground">Each table gets a unique QR code linked to your menu.</p>
      </div>

      <form onSubmit={add} className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 sm:flex-row">
        <Input
          placeholder="Table name (e.g. Table 1, Patio A, Bar 3)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={busy} className="shrink-0"><Plus className="mr-1 h-4 w-4" /> Add table</Button>
      </form>

      {tables.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <h3 className="font-display text-lg font-semibold">No tables yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Add your first table to generate its QR code.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((t) => {
            const url = `${baseUrl}/m/${slug}/${t.id}`;
            return (
              <div key={t.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-lg font-semibold">{t.name}</h3>
                    <p className="mt-1 break-all text-xs text-muted-foreground">{url}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => del(t.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="mt-4 flex items-center justify-center rounded-xl bg-secondary/40 p-4">
                  <QRCodeSVG value={url} size={140} bgColor="transparent" fgColor="#2d2d2d" />
                </div>
                <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => setQrTable(t)}>
                  <Printer className="mr-2 h-4 w-4" /> View & print
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!qrTable} onOpenChange={(o) => !o && setQrTable(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{qrTable?.name}</DialogTitle>
          </DialogHeader>
          {qrTable && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="rounded-2xl bg-white p-6 shadow-soft">
                <QRCodeSVG value={`${baseUrl}/m/${slug}/${qrTable.id}`} size={256} />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Scan to view {active?.restaurant.name} menu — {qrTable.name}
              </p>
              <Button onClick={() => window.print()} variant="outline">
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
