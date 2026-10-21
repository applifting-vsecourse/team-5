import { createFileRoute, Link } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"

import { Seo } from "@/components/Seo"

export const Route = createFileRoute("/_ProtectedPages/clients/$clientId")({
  component: ClientDetailPage,
})

function ClientDetailPage() {
  const { clientId } = Route.useParams()

  return (
    <>
      <Seo title="Detail klienta" />
      <section className="mx-auto w-full max-w-2xl px-4 py-6 md:py-8">
        <Link
          to="/clients"
          className="group mb-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground outline-hidden transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Zpět na seznam klientů"
        >
          <ChevronLeft className="size-5 transition-transform group-hover:-translate-x-0.5" />
          <span>Klienti</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Detail klienta</h1>
        <p className="mt-2 text-sm text-muted-foreground">ID klienta: {clientId}</p>
      </section>
    </>
  )
}
