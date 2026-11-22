import { ROUTES } from "@/app/routes"

import type { SessionUser } from "@/features/auth/api/authSessionQueryOptions"

export function accountHome(user: Pick<SessionUser, "role">) {
  return user.role === "trainer" ? ROUTES.dashboard : ROUTES.dogs
}

/** Post-login default — always Přehled (Dnes for owners). Called from login.tsx, reset-password.tsx, getLandingRedirect. */
export function loginHome(_user?: Pick<SessionUser, "role">) {
  return ROUTES.dashboard
}
