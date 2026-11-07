import { useEffect, useRef } from "react"
import {
  createFileRoute,
  Outlet,
  redirect,
  useRouter,
  useRouterState,
} from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"
import { AppSidebar } from "@/components/AppSidebar"
import { BottomNav } from "@/components/BottomNav/BottomNav"
import { Seo } from "@/components/Seo"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { useSession } from "@/features/auth/hooks/useSession"
import { encodeRedirectUri } from "@/features/auth/lib/redirect"

export const Route = createFileRoute("/_ProtectedPages")({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.fetchQuery({
      ...authSessionQueryOptions(),
      staleTime: 0,
    })
    if (session) return { user: session.user }
    throw redirect({
      to: ROUTES.login,
      search: { from: encodeRedirectUri(location) },
    })
  },
  component: Layout,
})

function Layout() {
  const { user } = useSession()
  const router = useRouter()
  const isTrainingFlow = useRouterState({
    select: (state) =>
      /^\/trainings\/[^/]+(?:\/(?:finish|done))?\/?$/.test(state.location.pathname),
  })
  const identity = user ? `${user.id}:${user.role ?? ""}` : null
  const previousIdentity = useRef(identity)
  useEffect(() => {
    if (previousIdentity.current !== identity) {
      if (identity) void router.invalidate()
      else if (!router.state.isLoading) {
        void router.navigate({
          to: ROUTES.login,
          search: { from: encodeRedirectUri(router.state.location) },
          replace: true,
        })
      }
    }
    previousIdentity.current = identity
  }, [identity, router])
  const isTrainer = user?.role === "trainer" || user?.role === "admin"
  if (!user) return null
  if (isTrainingFlow) {
    return (
      <div
        key={user.id}
        className="min-h-dvh bg-background"
      >
        <Seo />
        <Outlet />
      </div>
    )
  }
  return (
    <div
      key={user.id}
      className="min-h-dvh md:flex"
    >
      <Seo />
      <AppSidebar
        user={{ name: user.name }}
        isTrainer={isTrainer}
      />
      <main className="min-w-0 flex-1 pb-[calc(var(--spacing-tab-bar)+var(--spacing-safe-bottom)+1rem)] md:pb-8">
        <Outlet />
      </main>
      <BottomNav isTrainer={isTrainer} />
    </div>
  )
}
