import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

export const Route = createFileRoute("/_ProtectedPages/clients")({
  component: ClientsPage,
})

function ClientsPage() {
  return (
    <>
      <Seo title="Klienti" />
      <section className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Klienti</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Přehled svěřenců a záznamů čekajících na reakci.
        </p>
      </section>
    </>
  )
}
