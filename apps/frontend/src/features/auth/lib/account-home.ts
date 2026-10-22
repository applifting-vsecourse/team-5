import { ROUTES } from "@/app/routes"

import type { SessionUser } from "@/features/auth/api/authSessionQueryOptions"

export function accountHome(user: Pick<SessionUser, "role">) {
  return user.role === "trainer" ? ROUTES.clients : ROUTES.dogs
}

export function loginHome(user: Pick<SessionUser, "role">) {
  return user.role === "trainer" ? ROUTES.clients : ROUTES.week
}
