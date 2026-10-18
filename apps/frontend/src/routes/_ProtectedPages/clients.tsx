import { createFileRoute, redirect } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"
import { Seo } from "@/components/Seo"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"

export const Route = createFileRoute("/_ProtectedPages/clients")({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(authSessionQueryOptions())
    if (!session) throw redirect({ to: ROUTES.login })
    if (session.user.role !== "trainer") throw redirect({ to: ROUTES.dogs })
  },
  component: ClientsPage,
})

function ClientsPage() {
  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-8">
      <Seo title="Klienti" />
      <h1 className="text-2xl font-semibold tracking-tight">Klienti</h1>
      <p className="mt-4 text-muted-foreground">Pozvěte prvního klienta</p>
    </section>
  )
}
