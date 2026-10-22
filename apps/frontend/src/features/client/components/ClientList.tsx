import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertCircle, UserPlus, Users } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import { clientsQueryOptions } from "@/features/client/api/clientsQueryOptions"

import { ClientCard } from "./ClientCard"
import { InviteClientDialog } from "./InviteClientDialog"
import { UnusedInvitations } from "./UnusedInvitations"

export function ClientList() {
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const { data: clients, isLoading, isError, refetch } = useQuery(clientsQueryOptions())

  return (
    <div className="flex flex-col gap-6">
      {/* Nadpis a akce (Figma node 50:97) */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Vaši klienti</h1>
        {clients && clients.length > 0 && (
          <Button
            variant="default"
            className="min-h-11 font-medium"
            onClick={() => setIsInviteOpen(true)}
            aria-label="Pozvat klienta"
          >
            <UserPlus
              className="mr-1.5 size-4"
              aria-hidden="true"
            />
            Pozvat klienta
          </Button>
        )}
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
        <Alert variant="destructive">
          <AlertCircle
            className="size-4"
            aria-hidden="true"
          />
          <AlertTitle>Chyba při načítání klientů</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col items-start gap-3">
            <span>
              Nepodařilo se načíst seznam klientů. Zkontrolujte prosím připojení k síti a zkuste to
              znovu.
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11"
              onClick={() => void refetch()}
            >
              Zkusit znovu
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Empty state */}
      {!isLoading && !isError && clients && clients.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center sm:p-12">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Users
              className="size-6 text-muted-foreground"
              aria-hidden="true"
            />
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
            <UserPlus
              className="mr-1.5 size-4"
              aria-hidden="true"
            />
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
