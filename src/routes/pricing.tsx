import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingHeader, MarketingFooter } from "@/components/marketing-shell";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Smart Menu" },
      { name: "description", content: "Simple monthly and yearly plans for restaurants of every size." },
      { property: "og:title", content: "Pricing — Smart Menu" },
      { property: "og:description", content: "Simple monthly and yearly plans for restaurants of every size." },
    ],
  }),
  component: Pricing,
});

const plans = [
  {
    name: "Starter",
    price: 19,
    yearly: 190,
    desc: "Perfect for cafés and small restaurants.",
    features: ["Up to 50 menu items", "10 tables", "QR codes", "Real-time kitchen tickets", "Email support"],
  },
  {
    name: "Growth",
    price: 49,
    yearly: 490,
    desc: "For growing restaurants and hotels.",
    features: ["Unlimited menu items", "Unlimited tables", "Multi-role staff (owner/staff/chef)", "Branded customer menu", "Priority support"],
    popular: true,
  },
  {
    name: "Scale",
    price: 129,
    yearly: 1290,
    desc: "For multi-location and high-volume venues.",
    features: ["Everything in Growth", "Multi-location ready", "Custom domain", "Analytics dashboard", "Dedicated success manager"],
  },
];

function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-5xl font-semibold md:text-6xl">Simple, fair pricing</h1>
          <p className="mt-4 text-lg text-muted-foreground">Start free for 14 days. Cancel anytime.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-3xl border bg-card p-8 ${p.popular ? "border-primary shadow-elegant" : "border-border"}`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-2xl font-semibold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-5xl font-semibold">${p.price}</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              <p className="text-xs text-muted-foreground">or ${p.yearly}/year (save 17%)</p>
              <Button asChild className="mt-6 w-full" variant={p.popular ? "default" : "outline"}>
                <Link to="/signup">Start free trial</Link>
              </Button>
              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-none text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}
