import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { z } from "zod";

export const Route = createFileRoute("/m/$slug/$tableId/thanks")({
  validateSearch: z.object({ order: z.string().optional() }),
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: Thanks,
});

function Thanks() {
  const { slug, tableId } = Route.useParams();
  const { order } = Route.useSearch();
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-warm px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
          <Check className="h-8 w-8" />
        </div>
        <h1 className="mt-5 font-display text-3xl font-semibold">Order placed!</h1>
        <p className="mt-2 text-muted-foreground">The kitchen has been notified. Sit tight — your order is on the way.</p>
        {order && <p className="mt-4 font-mono text-xs text-muted-foreground">Reference: #{order.slice(0, 8)}</p>}
        <Button asChild className="mt-6 w-full" variant="outline">
          <Link to="/m/$slug/$tableId" params={{ slug, tableId }}>Back to menu</Link>
        </Button>
      </div>
    </div>
  );
}
