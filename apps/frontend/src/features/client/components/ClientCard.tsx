import { Link } from "@tanstack/react-router"
import { ChevronRight } from "lucide-react"

import { PesAvatar } from "@/components/PesAvatar"

import type { Client } from "@/features/client/api/clientSchemas"

type ClientCardProps = {
  client: Client
}

export function ClientCard({ client }: ClientCardProps) {
  const displayedDogs = client.dogs.slice(0, 3)
  const remainingCount = client.dogs.length - displayedDogs.length

  return (
    <Link
      to="/clients/$clientId"
      params={{ clientId: client.id }}
      className="group flex min-h-11 w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 outline-hidden transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {/* Dog avatars */}
      <div className="flex shrink-0 items-center">
        {displayedDogs.length > 0 ? (
          <>
            {displayedDogs.map((dog, index) => (
              <div
                key={dog.id}
                className={index > 0 ? "-ml-2 rounded-full ring-2 ring-card" : "rounded-full"}
              >
                <PesAvatar
                  name={dog.name}
                  color={dog.color}
                  size="md"
                />
              </div>
            ))}
            {remainingCount > 0 && (
              <div
                className="-ml-2 flex size-10 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground ring-2 ring-card"
                title={`A další ${remainingCount} ${remainingCount === 1 ? "pes" : remainingCount < 5 ? "psi" : "psů"}`}
                aria-label={`A další ${remainingCount} ${remainingCount === 1 ? "pes" : remainingCount < 5 ? "psi" : "psů"}`}
                role="img"
              >
                +{remainingCount}
              </div>
            )}
          </>
        ) : (
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
            –
          </div>
        )}
      </div>

      {/* Client details */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-base font-medium text-foreground">{client.name}</span>
        <span className="truncate text-sm text-muted-foreground">{client.email}</span>
      </div>

      {/* Chevron indicator */}
      <ChevronRight
        className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  )
}
