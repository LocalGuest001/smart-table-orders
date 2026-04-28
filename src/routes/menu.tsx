import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/menu")({
  component: MenuRedirect,
});

function MenuRedirect() {
  // The customer menu lives at /m/:slug/:tableId (scanned via QR).
  // Owners managing their menu should land in the dashboard.
  return <Navigate to="/dashboard/menu" replace />;
}
