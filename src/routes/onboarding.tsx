import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { slugify } from "@/lib/types";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Set up your restaurant — Smart Menu" }] }),
  component: Onboarding,
});

function Onboarding() {
  const { user, loading, refreshMemberships, setActiveRestaurantId, memberships } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (!loading && user && memberships.length > 0) navigate({ to: "/dashboard" });
  }, [user, loading, memberships, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);

    const baseSlug = slugify(name) || "restaurant";
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

    const { data: rest, error } = await supabase
      .from("restaurants")
      .insert({ owner_id: user.id, name, slug, address, phone })
      .select()
      .single();

    if (error || !rest) {
      setBusy(false);
      toast.error(error?.message ?? "Could not create restaurant");
      return;
    }

    const { error: roleErr } = await supabase
      .from("user_roles")
      .insert({ user_id: user.id, restaurant_id: rest.id, role: "owner" });
    if (roleErr) {
      setBusy(false);
      toast.error(roleErr.message);
      return;
    }

    await refreshMemberships();
    setActiveRestaurantId(rest.id);
    toast.success("Restaurant created!");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-warm px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-soft">
        <h1 className="font-display text-3xl font-semibold">Set up your restaurant</h1>
        <p className="mt-1 text-sm text-muted-foreground">A few quick details and you're ready.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Restaurant name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Creating…" : "Create restaurant"}
          </Button>
        </form>
      </div>
    </div>
  );
}
