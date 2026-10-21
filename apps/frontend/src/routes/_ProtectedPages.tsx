import { useEffect, useRef } from "react"
import { createFileRoute, Outlet, redirect, useRouter } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"
import { BottomNav } from "@/components/BottomNav/BottomNav"
import { Header } from "@/components/Header/Header"
import { HeaderNav } from "@/components/Header/HeaderNav"
import { Seo } from "@/components/Seo"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { HeaderMenu } from "@/features/auth/components/HeaderMenu"
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
  const isTrainer = user?.role === "trainer"
  if (!user) return null
  return (
    <div
      key={user.id}
      className="flex min-h-svh flex-col"
    >
      <Seo />
      <Header
        className="hidden md:block"
        nav={<HeaderNav isTrainer={isTrainer} />}
        userMenu={<HeaderMenu />}
      />
      <main className="flex-1 pb-20 md:pb-8">
        <Outlet />
      </main>
      <BottomNav isTrainer={isTrainer} />
    </div>
  )
}
