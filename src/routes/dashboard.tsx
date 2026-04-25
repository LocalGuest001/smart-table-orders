import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth, useActiveMembership } from "@/lib/auth-context";
import { LayoutDashboard, UtensilsCrossed, QrCode, ChefHat, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Smart Menu" }] }),
  component: DashboardLayout,
});

const nav = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Overview", exact: true },
  { to: "/dashboard/menu", icon: UtensilsCrossed, label: "Menu" },
  { to: "/dashboard/tables", icon: QrCode, label: "Tables & QR" },
  { to: "/dashboard/kitchen", icon: ChefHat, label: "Kitchen" },
  { to: "/dashboard/settings", icon: Settings, label: "Settings" },
] as const;

function DashboardLayout() {
  const { user, loading, signOut, memberships } = useAuth();
  const active = useActiveMembership();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (!loading && user && memberships.length === 0) navigate({ to: "/onboarding" });
  }, [user, loading, memberships, navigate]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <aside className="hidden w-64 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
            <span className="font-display text-sm font-semibold">S</span>
          </div>
          <span className="font-display text-lg font-semibold">Smart Menu</span>
        </div>
        <div className="border-b border-sidebar-border px-5 py-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Restaurant</p>
          <p className="mt-1 truncate font-semibold">{active?.restaurant.name ?? "—"}</p>
          <p className="text-xs capitalize text-muted-foreground">{active?.role}</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((n) => {
            const isActive = n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => void signOut()}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
          <span className="font-display text-lg font-semibold">Smart Menu</span>
          <Button variant="ghost" size="sm" onClick={() => void signOut()}><LogOut className="h-4 w-4" /></Button>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-2 py-2 lg:hidden">
          {nav.map((n) => {
            const isActive = n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs ${
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                <n.icon className="h-3.5 w-3.5" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
