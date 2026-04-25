import { createFileRoute } from "@tanstack/react-router";
import { MarketingHeader, MarketingFooter } from "@/components/marketing-shell";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Smart Menu" },
      { name: "description", content: "QR menus, table ordering, real-time kitchen tickets, multi-role staff, and more." },
      { property: "og:title", content: "Features — Smart Menu" },
      { property: "og:description", content: "QR menus, table ordering, real-time kitchen tickets, multi-role staff, and more." },
    ],
  }),
  component: Features,
});

const sections = [
  {
    title: "Menu Management",
    body: "Categories, items, prices, photos, allergens, variants, and add-ons. Everything you need to represent your kitchen accurately, with availability toggles for sold-out items.",
  },
  {
    title: "Table & QR Management",
    body: "Create any table layout (Indoor 1, Patio A, Bar 3). Each table gets its own QR. Print, share, or display them — orders arrive tagged with the right table automatically.",
  },
  {
    title: "Customer Ordering",
    body: "Lightning-fast mobile menu. No download, no signup. Guests browse, add to cart, customize with variants and notes, and place orders in seconds.",
  },
  {
    title: "Real-time Kitchen Tickets",
    body: "A live KOT board for the kitchen. New orders appear instantly. Move tickets through Pending → Preparing → Done with a single tap. Built on real-time subscriptions.",
  },
  {
    title: "Multi-role Access",
    body: "Owner, staff, and chef roles per restaurant — enforced at the database with row-level security. Invite your team without sharing credentials.",
  },
  {
    title: "Brand Customization",
    body: "Logo, name, address, hours, and theme color. Your guests see your brand the moment they scan.",
  },
];

function Features() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <h1 className="font-display text-5xl font-semibold md:text-6xl">Built for the rush.</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Every part of Smart Menu is engineered for the realities of a busy restaurant — fast, reliable, and effortless to operate.
        </p>
        <div className="mt-14 grid gap-10 md:grid-cols-2">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="font-display text-2xl font-semibold">{s.title}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}
