import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router"

import { LandingPage } from "@/app/LandingPage"
import { ROUTES } from "@/app/routes"

import { authSessionQueryOptions, type Session } from "@/features/auth/api/authSessionQueryOptions"

export function getLandingRedirect(session: Session): string | null {
  if (!session?.user) return null
  return session.user.role === "trainer" ? ROUTES.clients : ROUTES.week
}

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    try {
      const session = await context.queryClient.ensureQueryData(authSessionQueryOptions())
      const redirectTarget = getLandingRedirect(session)
      if (redirectTarget) {
        throw redirect({ to: redirectTarget })
      }
    } catch (error) {
      if (isRedirect(error)) {
        throw error
      }
      // Při síťové chybě nezobrazovat error boundary na veřejné úvodní stránce
    }
  },
  component: LandingPage,
})
