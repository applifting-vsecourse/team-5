import { Link } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"

import type { Client } from "@/features/client/api/clientSchemas"

import { ClientDogCard } from "./ClientDogCard"

type ClientDetailViewProps = {
  client: Client
}

export function ClientDetailView({ client }: ClientDetailViewProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <nav aria-label="Navigace zpět">
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
      </nav>

      {/* Client header */}
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{client.name}</h1>
        <p className="text-sm text-muted-foreground">{client.email}</p>
      </header>

      {/* Shared dogs section */}
      <section
        aria-label="Sdílení psi"
        className="flex flex-col gap-4"
      >
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Sdílení psi</h2>

        {client.dogs.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Klient s vámi zatím nesdílí žádného psa.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {client.dogs.map((dog) => (
              <ClientDogCard
                key={dog.id}
                dog={dog}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
