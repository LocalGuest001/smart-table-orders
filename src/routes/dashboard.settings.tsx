import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveMembership, useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/settings")({ component: SettingsPage });

function SettingsPage() {
  const active = useActiveMembership();
  const { refreshMemberships } = useAuth();
  const restaurantId = active?.restaurant.id;
  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "", opening_hours: "", logo_url: "", theme_color: "#c4654a" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;
    (async () => {
      const { data } = await supabase.from("restaurants").select("*").eq("id", restaurantId).single();
      if (data) {
        setForm({
          name: data.name ?? "",
          address: data.address ?? "",
          phone: data.phone ?? "",
          email: data.email ?? "",
          opening_hours: data.opening_hours ?? "",
          logo_url: data.logo_url ?? "",
          theme_color: data.theme_color ?? "#c4654a",
        });
      }
    })();
  }, [restaurantId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;
    setBusy(true);
    const { error } = await supabase.from("restaurants").update(form).eq("id", restaurantId);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Saved"); refreshMemberships(); }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Settings</h1>
        <p className="mt-1 text-muted-foreground">Restaurant profile and branding.</p>
      </div>

      <form onSubmit={save} className="grid max-w-2xl gap-5 rounded-2xl border border-border bg-card p-6">
        <div className="space-y-2">
          <Label>Restaurant name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Address</Label>
          <Textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Opening hours</Label>
          <Input value={form.opening_hours} onChange={(e) => setForm({ ...form, opening_hours: e.target.value })} placeholder="Mon–Sun · 11am–11pm" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://…" />
          </div>
          <div className="space-y-2">
            <Label>Theme color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.theme_color}
                onChange={(e) => setForm({ ...form, theme_color: e.target.value })}
                className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background"
              />
              <Input value={form.theme_color} onChange={(e) => setForm({ ...form, theme_color: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-primary-soft/40 p-4 text-sm">
          <p className="font-semibold">Subscription</p>
          <p className="capitalize text-muted-foreground">{active?.restaurant.subscription_status} · billing comes next</p>
        </div>
        <Button type="submit" disabled={busy} className="w-fit">{busy ? "Saving…" : "Save changes"}</Button>
      </form>
    </div>
  );
}
