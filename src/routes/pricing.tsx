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
    price: 1499,
    yearly: 14990,
    desc: "Perfect for cafés and small restaurants.",
    features: ["Up to 50 menu items", "10 tables", "QR codes", "Real-time kitchen tickets", "Email support"],
  },
  {
    name: "Growth",
    price: 3999,
    yearly: 39990,
    desc: "For growing restaurants and hotels.",
    features: ["Unlimited menu items", "Unlimited tables", "Multi-role staff (owner/staff/chef)", "Branded customer menu", "Priority support"],
    popular: true,
  },
  {
    name: "Scale",
    price: 9999,
    yearly: 99990,
    desc: "For multi-location and high-volume venues.",
    features: ["Everything in Growth", "Multi-location ready", "Custom domain", "Analytics dashboard", "Dedicated success manager"],
  },
];

const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-3xl font-semibold sm:text-4xl md:text-5xl lg:text-6xl">
            Simple, fair pricing
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:mt-4 sm:text-lg">
            Start free for 14 days. Cancel anytime.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-md gap-6 sm:max-w-xl sm:grid-cols-2 sm:mt-12 md:mt-14 lg:max-w-none lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-3xl border bg-card p-6 sm:p-8 ${
                p.popular ? "border-primary shadow-elegant sm:col-span-2 lg:col-span-1" : "border-border"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-xl font-semibold sm:text-2xl">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-5 flex flex-wrap items-baseline gap-1 sm:mt-6">
                <span className="font-display text-4xl font-semibold sm:text-5xl">{inr(p.price)}</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              <p className="text-xs text-muted-foreground">or {inr(p.yearly)}/year (save 17%)</p>
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
