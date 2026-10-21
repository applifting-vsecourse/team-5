import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

import { ClientList } from "@/features/client/components/ClientList"

export const Route = createFileRoute("/_ProtectedPages/clients")({
  component: ClientsPage,
})

function ClientsPage() {
  return (
    <>
      <Seo title="Klienti" />
      <section className="mx-auto w-full max-w-2xl px-4 py-6 md:py-8">
        <ClientList />
      </section>
    </>
  )
}
