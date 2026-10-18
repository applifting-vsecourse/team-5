import { createFileRoute, redirect } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"
import { Seo } from "@/components/Seo"

export const Route = createFileRoute("/_ProtectedPages/clients")({
  beforeLoad: ({ context }) => {
    if (context.user.role !== "trainer") throw redirect({ to: ROUTES.dogs })
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
