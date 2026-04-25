import { createFileRoute } from "@tanstack/react-router";
import { MarketingHeader, MarketingFooter } from "@/components/marketing-shell";
import { Mail, MessageCircle, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Smart Menu" },
      { name: "description", content: "Get in touch with the Smart Menu team." },
      { property: "og:title", content: "Contact — Smart Menu" },
      { property: "og:description", content: "Get in touch with the Smart Menu team." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <h1 className="font-display text-5xl font-semibold md:text-6xl">Let's talk.</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Questions about pricing, onboarding, or running Smart Menu at scale? We're here.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: Mail, title: "Email", body: "hello@smartmenu.app" },
            { icon: MessageCircle, title: "Live chat", body: "Mon–Fri, 9am–6pm" },
            { icon: MapPin, title: "Office", body: "Remote, worldwide" },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}
