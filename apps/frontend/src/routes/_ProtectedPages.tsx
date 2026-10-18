import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"
import { Header } from "@/components/Header/Header"
import { Seo } from "@/components/Seo"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { BottomNav } from "@/features/auth/components/BottomNav"
import { HeaderMenu } from "@/features/auth/components/HeaderMenu"
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
  return (
    <>
      <Seo />
      <Header userMenu={<HeaderMenu />} />
      <main className="min-h-svh pb-16">
        <Outlet />
      </main>
      <BottomNav />
    </>
  )
}
