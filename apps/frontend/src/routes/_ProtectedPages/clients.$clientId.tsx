import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { AlertCircle, ChevronLeft } from "lucide-react"

import { Seo } from "@/components/Seo"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { clientDetailQueryOptions } from "@/features/client/api/clientsQueryOptions"
import { ClientDetailView } from "@/features/client/components/ClientDetailView"

export const Route = createFileRoute("/_ProtectedPages/clients/$clientId")({
  component: ClientDetailPage,
})

function ClientDetailPage() {
  const { clientId } = Route.useParams()
  const clientQuery = useQuery(clientDetailQueryOptions(clientId))

  if (clientQuery.isLoading) {
    return (
      <section className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 md:py-8">
        <Skeleton className="h-6 w-24" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-3 pt-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </section>
    )
  }

  if (clientQuery.error || !clientQuery.data) {
    return (
      <section className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6 md:py-8">
        <Link
          to="/clients"
          className="group inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground outline-hidden transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Zpět na seznam klientů"
        >
          <ChevronLeft
            className="size-5 transition-transform group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
          <span>Klienti</span>
        </Link>
        <Alert variant="destructive">
          <AlertCircle
            className="size-4"
            aria-hidden="true"
          />
          <AlertTitle>Klient nebyl nalezen</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>Tento klient neexistuje nebo k němu nemáte přístup.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11"
              onClick={() => void clientQuery.refetch()}
            >
              Zkusit znovu
            </Button>
          </AlertDescription>
        </Alert>
      </section>
    )
  }

  const client = clientQuery.data

  return (
    <>
      <Seo title={`${client.name} · Detail klienta`} />
      <section className="mx-auto w-full max-w-2xl px-4 py-6 md:py-8">
        <ClientDetailView client={client} />
      </section>
    </>
  )
}
