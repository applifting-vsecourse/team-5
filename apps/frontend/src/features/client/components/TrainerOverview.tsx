import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Calendar, ChevronRight, PawPrint, UserPlus, Users } from "lucide-react"

import { ROUTES } from "@/app/routes"
import { EmptyState } from "@/components/EmptyState"
import { HeroCard } from "@/components/HeroCard"
import { Metric } from "@/components/Metric"
import { PesAvatar } from "@/components/PesAvatar"
import { QueryState } from "@/components/QueryState"
import { StatusChip } from "@/components/StatusChip"
import { StripCard } from "@/components/StripCard"
import { Button } from "@/components/ui/button"

import type { Client } from "@/features/client/api/clientSchemas"
import {
  clientInvitationsQueryOptions,
  clientsQueryOptions,
} from "@/features/client/api/clientsQueryOptions"

import { InviteClientDialog } from "./InviteClientDialog"

function dogCountLabel(count: number): string {
  if (count === 1) return "1 pes"
  if (count >= 2 && count <= 4) return `${count} psi`
  return `${count} psů`
}

function ClientOverviewRow({ client }: { client: Client }) {
  const primaryDog = client.dogs[0]
  const extraDogs = Math.max(client.dogs.length - 1, 0)

  return (
    <StripCard dogColor={primaryDog?.color}>
      <Link
        to="/clients/$clientId"
        params={{ clientId: client.id }}
        className="flex min-h-11 items-center gap-3 px-4 py-3 outline-hidden transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <div className="flex shrink-0 items-center">
          {primaryDog ? (
            <PesAvatar
              name={primaryDog.name}
              color={primaryDog.color}
              size="md"
              photoUrl={primaryDog.photoUrl}
            />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
              –
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-base font-semibold text-foreground">{client.name}</span>
          <span className="truncate text-sm text-muted-foreground">
            {client.dogs.length === 0
              ? "Zatím bez sdíleného psa"
              : extraDogs > 0
                ? `${primaryDog?.name} · +${extraDogs}`
                : primaryDog?.name}
          </span>
        </div>
        <ChevronRight
          className="size-5 shrink-0 text-muted-foreground"
          aria-hidden
        />
      </Link>
    </StripCard>
  )
}

export function TrainerOverview() {
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const clientsQuery = useQuery(clientsQueryOptions())
  const invitationsQuery = useQuery(clientInvitationsQueryOptions())

  const clients = clientsQuery.data ?? []
  const invitations = invitationsQuery.data ?? []
  const sharedDogs = clients.reduce((sum, client) => sum + client.dogs.length, 0)
  const isLoading = clientsQuery.isLoading
  const isError = clientsQuery.isError
  const error = clientsQuery.error ?? new Error("Nepodařilo se načíst přehled.")

  const retry = () => {
    void clientsQuery.refetch()
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 md:py-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-page font-extrabold tracking-tight text-foreground">Přehled</h1>
          <Button
            variant="outline"
            onClick={() => setIsInviteOpen(true)}
          >
            <UserPlus
              className="size-4"
              aria-hidden
            />
            Pozvat
          </Button>
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          Klienti, sdílení psi a čekající pozvánky na jednom místě.
        </p>
      </header>

      <QueryState
        isLoading={isLoading}
        error={isError ? error : null}
        isEmpty={false}
        empty={null}
        onRetry={retry}
        loadingLabel="Načítání přehledu"
        errorTitle="Přehled se nepodařilo načíst"
        errorDescription="Zkontrolujte připojení a zkuste to znovu."
      >
        <div className="flex flex-col gap-6">
          <HeroCard eyebrow="Pracovní prostor">
            <div className="grid grid-cols-3 gap-3">
              <Metric
                isOnHero
                value={clients.length}
                label="klientů"
              />
              <Metric
                isOnHero
                value={sharedDogs}
                label="sdílených psů"
              />
              <Metric
                isOnHero
                value={invitations.length}
                label="pozvánek"
              />
            </div>
            {invitations.length > 0 ? (
              <StatusChip tone="warning">{invitations.length} čeká na přijetí</StatusChip>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="w-full sm:flex-1"
              >
                <Link to={ROUTES.clients}>
                  <Users
                    className="size-4"
                    aria-hidden
                  />
                  Klienti
                </Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                size="lg"
                className="w-full sm:flex-1"
              >
                <Link to={ROUTES.week}>
                  <Calendar
                    className="size-4"
                    aria-hidden
                  />
                  Kalendář
                </Link>
              </Button>
            </div>
          </HeroCard>

          <section
            aria-labelledby="overview-clients-heading"
            className="flex flex-col gap-3"
          >
            <div className="flex items-center justify-between gap-3">
              <h2
                id="overview-clients-heading"
                className="text-section font-extrabold text-foreground"
              >
                Klienti
              </h2>
              <Button
                asChild
                variant="ghost"
                size="sm"
              >
                <Link to={ROUTES.clients}>Všichni</Link>
              </Button>
            </div>

            {clients.length === 0 ? (
              <EmptyState
                icon={Users}
                chip="BEZ KLIENTŮ"
                title="Zatím nemáte žádné klienty"
                titleAs="p"
                description="Pozvěte prvního klienta kódem nebo e-mailem a uvidíte tady jeho sdílené psy."
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
                    Pozvat klienta
                  </Button>
                }
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {clients.slice(0, 5).map((client) => (
                  <li key={client.id}>
                    <ClientOverviewRow client={client} />
                  </li>
                ))}
              </ul>
            )}

            {clients.length > 5 ? (
              <p className="text-sm text-muted-foreground">
                Zobrazeno 5 z {clients.length}. Další najdete v seznamu klientů.
              </p>
            ) : null}
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:flex-1"
            >
              <Link to={ROUTES.dogs}>
                <PawPrint
                  className="size-4"
                  aria-hidden
                />
                Moji psi
              </Link>
            </Button>
            {sharedDogs > 0 ? (
              <p className="text-sm text-muted-foreground sm:text-right">
                S klienty sdílíte {dogCountLabel(sharedDogs)}.
              </p>
            ) : null}
          </div>
        </div>
      </QueryState>

      <InviteClientDialog
        isOpen={isInviteOpen}
        onOpenChange={setIsInviteOpen}
      />
    </div>
  )
}
