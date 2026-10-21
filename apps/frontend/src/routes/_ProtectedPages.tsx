import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

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
  loader: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(authSessionQueryOptions())
    if (session) return
    context.queryClient.clear()
    throw redirect({
      to: ROUTES.login,
      search: { from: encodeRedirectUri(location) },
    })
  },
  component: Layout,
})

function Layout() {
  const { user } = useSession()
  const isTrainer = user?.role === "trainer"
  return (
    <div className="flex min-h-svh flex-col">
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
