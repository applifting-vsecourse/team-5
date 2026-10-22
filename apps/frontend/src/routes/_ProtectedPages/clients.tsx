import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"

// Clients are a trainer area (the API enforces the same roles). The parent
// route has already resolved the session, so anonymous visitors never get here;
// owners are sent back to their dogs.
const CLIENT_ROLES = ["trainer", "admin"]

export const Route = createFileRoute("/_ProtectedPages/clients")({
  beforeLoad: ({ context }) => {
    if (!CLIENT_ROLES.includes(context.user.role ?? "")) throw redirect({ to: ROUTES.dogs })
  },
  component: Outlet,
})
