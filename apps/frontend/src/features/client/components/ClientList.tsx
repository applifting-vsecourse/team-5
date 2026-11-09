import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { differenceInCalendarDays } from "date-fns"
import { Mail, Search, UserPlus, Users } from "lucide-react"

import { EmptyState } from "@/components/EmptyState"
import { QueryState } from "@/components/QueryState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { useCancelInvitation } from "@/features/client/api/cancelInvitation"
import type { Invitation } from "@/features/client/api/clientSchemas"
import {
  clientInvitationsQueryOptions,
  clientsQueryOptions,
} from "@/features/client/api/clientsQueryOptions"
import { trainerOverviewQueryOptions } from "@/features/client/api/trainerOverview"

import { ClientCard, type ClientListExtras } from "./ClientCard"
import { CopyInviteLinkButton } from "./CopyInviteLinkButton"
import { InviteClientDialog } from "./InviteClientDialog"

function lastActivityLabel(
  lastTraining: { title: string; completedAt: Date } | null | undefined,
  dogCount: number,
  now: Date,
): string {
  if (!lastTraining) return dogCount ? "Zatím bez tréninku" : "Zatím bez sdíleného psa"
  const days = differenceInCalendarDays(now, lastTraining.completedAt)
  const when = days <= 0 ? "Dnes" : days === 1 ? "Včera" : `Před ${days} dny`
  return `${when} · ${lastTraining.title}`
}

function formatExpirationDate(date: Date): string {
  return `vyprší ${date.getDate()}. ${date.getMonth() + 1}.`
}

function InviteRow({ invitation }: { invitation: Invitation }) {
  const cancelMutation = useCancelInvitation()
  return (
    <li className="flex min-h-touch items-center gap-3 rounded-card border border-dashed border-border bg-card p-3">
      <span
        aria-hidden
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground"
      >
        <Mail className="size-5" />
      </span>
      <span className="min-w-0 flex-1 space-y-0.5">
        <span className="block truncate text-sm font-bold">
          {invitation.email ?? `Kód ${invitation.code}`}
        </span>
        <span className="block text-xs font-medium text-muted-foreground">
          Pozvánka čeká · {formatExpirationDate(new Date(invitation.expiresAt))}
        </span>
      </span>
      <CopyInviteLinkButton
        code={invitation.code}
        isCompact
      />
      <Button
        variant="ghost"
        size="sm"
        className="shrink-0 font-bold text-destructive"
        onClick={() => cancelMutation.mutate(invitation.id)}
        disabled={cancelMutation.isPending}
        aria-label={`Zrušit pozvánku ${invitation.code}`}
      >
        Zrušit
      </Button>
    </li>
  )
}

export function ClientList() {
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [search, setSearch] = useState("")
  const clientsQuery = useQuery(clientsQueryOptions())
  const overviewQuery = useQuery(trainerOverviewQueryOptions())
  const invitationsQuery = useQuery(clientInvitationsQueryOptions())
  const now = useMemo(() => new Date(), [])
  const clients = useMemo(() => clientsQuery.data ?? [], [clientsQuery.data])
  const invitations = invitationsQuery.data ?? []
  const overview = overviewQuery.data
  const overviewByClient = useMemo(() => {
    return new Map((overview?.clients ?? []).map((client) => [client.id, client]))
  }, [overview?.clients])
  const extrasByClient = useMemo(() => {
    const map = new Map<string, ClientListExtras>()
    for (const client of clients) {
      const overviewClient = overviewByClient.get(client.id)
      map.set(client.id, {
        successRate: overviewClient?.successRate ?? null,
        lastActivity: lastActivityLabel(
          overviewClient?.lastTraining ?? null,
          client.dogs.length,
          now,
        ),
      })
    }
    return map
  }, [clients, now, overviewByClient])
  const query = search.trim().toLowerCase()
  const filteredClients = clients.filter((client) => {
    if (!query) return true
    const haystack = [client.name, client.email, ...client.dogs.map((dog) => dog.name)]
      .join(" ")
      .toLowerCase()
    return haystack.includes(query)
  })
  const filteredInvites = invitations.filter((invitation) => {
    if (!query) return true
    return `${invitation.email ?? ""} ${invitation.code}`.toLowerCase().includes(query)
  })
  const isLoading = clientsQuery.isLoading
  const isError = clientsQuery.isError
  const counts = {
    active: clients.filter((client) => client.dogs.length > 0).length,
    invite: invitations.length,
  }
  const isListEmpty = filteredClients.length === 0 && filteredInvites.length === 0
  const hasNoClientsAtAll = clients.length === 0 && invitations.length === 0

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-page font-extrabold tracking-tight text-foreground">Klienti</h1>
          <p className="text-sm text-muted-foreground">
            {counts.active} aktivních
            {counts.invite > 0 ? ` · ${counts.invite} pozvánka čeká` : ""}
          </p>
        </div>
        <Button
          variant="default"
          size="icon"
          className="size-11 shrink-0"
          aria-label="Pozvat klienta"
          onClick={() => setIsInviteOpen(true)}
        >
          <UserPlus
            className="size-5"
            aria-hidden
          />
        </Button>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Hledat klienta nebo psa"
          aria-label="Hledat klienta nebo psa"
          className="h-11 rounded-field bg-card pl-9"
        />
      </div>

      <QueryState
        isLoading={isLoading}
        error={isError ? (clientsQuery.error ?? new Error("Nepodařilo se načíst klienty.")) : null}
        isEmpty={hasNoClientsAtAll}
        onRetry={() => void clientsQuery.refetch()}
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
        {isListEmpty ? (
          <p className="text-sm text-muted-foreground">Nic neodpovídá hledání.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                extras={extrasByClient.get(client.id)}
              />
            ))}
            {filteredInvites.map((invitation) => (
              <InviteRow
                key={invitation.id}
                invitation={invitation}
              />
            ))}
          </ul>
        )}
      </QueryState>

      <InviteClientDialog
        isOpen={isInviteOpen}
        onOpenChange={setIsInviteOpen}
      />
    </div>
  )
}
