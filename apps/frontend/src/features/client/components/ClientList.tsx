import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { UserPlus, Users } from "lucide-react"

import { EmptyState } from "@/components/EmptyState"
import { QueryState } from "@/components/QueryState"
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
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-page font-extrabold tracking-tight text-foreground">Klienti</h1>
        {clients && clients.length > 0 && (
          <Button
            variant="default"
            aria-label="Pozvat klienta"
            onClick={() => setIsInviteOpen(true)}
          >
            <UserPlus
              className="size-4"
              aria-hidden
            />
            Pozvat klienta
          </Button>
        )}
      </div>

      <QueryState
        isLoading={isLoading}
        error={isError ? (error ?? new Error("Nepodařilo se načíst seznam klientů.")) : null}
        isEmpty={!clients || clients.length === 0}
        onRetry={() => void refetch()}
        loadingLabel="Načítání klientů"
        errorTitle="Chyba při načítání klientů"
        errorDescription="Nepodařilo se načíst seznam klientů. Zkontroluj připojení a zkus to znovu."
        empty={
          <EmptyState
            icon={Users}
            chip="BEZ KLIENTŮ"
            title="Zatím nemáte žádné klienty"
            description="Pozvěte prvního klienta a získejte přístup k tréninkovým plánům a aktivitám jeho psů."
            action={
              <Button
                size="lg"
                className="w-full"
                onClick={() => setIsInviteOpen(true)}
              >
                <UserPlus
                  className="size-4"
                  aria-hidden
                />
                Pozvěte prvního klienta
              </Button>
            }
          />
        }
      >
        <div className="flex flex-col gap-3">
          {clients?.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
            />
          ))}
        </div>
      </QueryState>

      <UnusedInvitations />

      <InviteClientDialog
        isOpen={isInviteOpen}
        onOpenChange={setIsInviteOpen}
      />
    </div>
  )
}
