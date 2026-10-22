import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"

// Clients are a trainer area (the API enforces the same roles). Owners and
// anonymous visitors cannot open any /clients page by URL.
const CLIENT_ROLES = ["trainer", "admin"]

export const Route = createFileRoute("/_ProtectedPages/clients")({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(authSessionQueryOptions())
    if (!session) throw redirect({ to: ROUTES.login })
    if (!CLIENT_ROLES.includes(session.user.role ?? "")) throw redirect({ to: ROUTES.dogs })
  },
  component: Outlet,
})
