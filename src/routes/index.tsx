import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { MarketingHeader, MarketingFooter } from "@/components/marketing-shell";
import heroDish from "@/assets/hero-dish.jpg";
import { QrCode, ChefHat, Smartphone, Sparkles, Zap, Shield } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Menu — Digital Menus & QR Ordering for Restaurants" },
      {
        name: "description",
        content:
          "Launch beautiful QR-code menus, accept table orders, and run a real-time kitchen workflow. Built for restaurants and hotels.",
      },
      { property: "og:title", content: "Smart Menu — Digital Menus & QR Ordering" },
      {
        property: "og:description",
        content: "QR menus, real-time kitchen tickets, and table ordering — built for modern restaurants.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-warm opacity-60" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" /> New: Real-time Kitchen Tickets
            </span>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] text-foreground md:text-6xl lg:text-7xl">
              Your menu.<br />
              <span className="text-primary italic">Smarter.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Replace paper menus with beautiful QR experiences. Take orders straight from the table.
              Watch them flow into the kitchen in real time. No app required — for you or your guests.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-elegant">
                <Link to="/signup">Start free trial</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/features">See how it works</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">14-day trial. No credit card required.</p>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-primary/10 blur-2xl" aria-hidden />
            <img
              src={heroDish}
              alt="Beautifully plated dish on a warm linen tablecloth"
              width={1600}
              height={1200}
              className="relative aspect-[4/3] w-full rounded-3xl object-cover shadow-elegant"
            />
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-border bg-card p-4 shadow-soft md:flex md:items-center md:gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <QrCode className="h-5 w-5" />
              </div>
              <div className="text-sm">
                <p className="font-semibold">Scan to order</p>
                <p className="text-muted-foreground">Table 12 · 3 items</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/60 bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-10 sm:px-6 md:grid-cols-4">
          {[
            ["10×", "Faster ordering"],
            ["35%", "Higher table turnover"],
            ["0", "App downloads needed"],
            ["<2s", "Menu load time"],
          ].map(([k, v]) => (
            <div key={v} className="text-center">
              <div className="font-display text-3xl font-semibold text-primary">{k}</div>
              <div className="mt-1 text-sm text-muted-foreground">{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-semibold md:text-5xl">Everything your restaurant needs</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            One platform for menu, tables, orders, and the kitchen.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            { icon: Smartphone, title: "Beautiful QR menus", body: "Mobile-first menus that load instantly. Photos, allergens, variants, add-ons — all native." },
            { icon: QrCode, title: "Per-table QR codes", body: "Generate unique codes for every table. Orders arrive tagged automatically." },
            { icon: ChefHat, title: "Real-time KOT", body: "Live kitchen ticket display. Mark prep started or done with a tap." },
            { icon: Zap, title: "Built for peak hours", body: "Realtime updates and an optimized schema handle hundreds of concurrent diners." },
            { icon: Shield, title: "Multi-role access", body: "Owner, staff, and chef accounts with the right permissions out of the box." },
            { icon: Sparkles, title: "Branded experience", body: "Your logo, your colors. Guests scan and feel right at home in your brand." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-soft">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-10 text-primary-foreground md:p-16">
          <div className="relative z-10 max-w-2xl">
            <h2 className="font-display text-4xl font-semibold md:text-5xl">Ready to ditch paper menus?</h2>
            <p className="mt-4 text-lg opacity-90">Set up your restaurant in under 5 minutes. Your first menu is on us.</p>
            <Button asChild size="lg" variant="secondary" className="mt-8">
              <Link to="/signup">Create your account</Link>
            </Button>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
