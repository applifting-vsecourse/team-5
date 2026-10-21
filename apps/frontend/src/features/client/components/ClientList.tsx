import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertCircle, UserPlus, Users } from "lucide-react"

import { Button } from "@/components/ui/button"

import { clientsQueryOptions } from "@/features/client/api/clientsQueryOptions"

import { ClientCard } from "./ClientCard"
import { InviteClientDialog } from "./InviteClientDialog"
import { UnusedInvitations } from "./UnusedInvitations"

export function ClientList() {
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const { data: clients, isLoading, isError, error, refetch } = useQuery(clientsQueryOptions())

  return (
    <div className="flex flex-col gap-6">
      {/* Nadpis a akce (Figma node 50:97) */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Vaši klienti</h1>
        <Button
          variant="default"
          className="min-h-11 font-medium"
          onClick={() => setIsInviteOpen(true)}
          aria-label="Pozvat klienta"
        >
          <UserPlus className="mr-1.5 size-4" />
          Pozvat klienta
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div
          className="flex flex-col gap-2"
          aria-label="Načítání klientů"
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 w-full animate-pulse rounded-lg border border-border bg-muted/40"
            />
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div
          role="alert"
          className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-6 text-center"
        >
          <AlertCircle className="size-8 text-destructive" />
          <p className="mt-2 text-sm font-medium text-foreground">
            Nepodařilo se načíst seznam klientů.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {error instanceof Error ? error.message : "Zkontrolujte připojení k síti."}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 min-h-11"
            onClick={() => refetch()}
          >
            Zkusit znovu
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && clients && clients.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Users className="size-6 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-foreground">
            Zatím nemáte žádné klienty
          </h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Pozvěte prvního klienta a získejte přístup k tréninkovým plánům a aktivitám jeho psů.
          </p>
          <Button
            variant="default"
            className="mt-6 min-h-11"
            onClick={() => setIsInviteOpen(true)}
          >
            <UserPlus className="mr-1.5 size-4" />
            Pozvěte prvního klienta
          </Button>
        </div>
      )}

      {/* Populated list */}
      {!isLoading && !isError && clients && clients.length > 0 && (
        <div className="flex flex-col gap-2">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
            />
          ))}
        </div>
      )}

      {/* Unused invitations */}
      <UnusedInvitations />

      {/* Invite dialog stub for #58 */}
      <InviteClientDialog
        isOpen={isInviteOpen}
        onOpenChange={setIsInviteOpen}
      />
    </div>
  )
}
