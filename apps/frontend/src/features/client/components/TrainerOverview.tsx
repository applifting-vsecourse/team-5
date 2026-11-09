import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { differenceInCalendarDays } from "date-fns"
import { UserPlus, Users } from "lucide-react"

import { ROUTES } from "@/app/routes"
import { DesignIcon } from "@/components/DesignIcon"
import { EmptyState } from "@/components/EmptyState"
import { QueryState } from "@/components/QueryState"
import { Button } from "@/components/ui/button"
import { formatDayLong, todayCalendarDate } from "@/lib/calendarDate"
import { dogColorClass } from "@/lib/dogColors"
import { cn } from "@/lib/utils"

import { clientInvitationsQueryOptions } from "@/features/client/api/clientsQueryOptions"
import {
  trainerOverviewQueryOptions,
  type TrainerDashboard,
} from "@/features/client/api/trainerOverview"

import { InviteClientDialog } from "./InviteClientDialog"

type Attention = TrainerDashboard["attention"][number]
type OverviewClient = TrainerDashboard["clients"][number]

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName
}

// Czech vocative is not derivable from a name; the greeting keeps the nominative.
function greeting(now: Date): string {
  const hour = now.getHours()
  if (hour < 10) return "Dobré ráno"
  if (hour < 18) return "Dobrý den"
  return "Dobrý večer"
}

function signed(value: number, unit = ""): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "±"
  return `${sign}${Math.abs(Math.round(value))}${unit}`
}

function Trend({ change, unit, isOnHero }: { change: number; unit: string; isOnHero?: boolean }) {
  const isDown = change < 0
  return (
    <p
      className={cn(
        "flex items-center gap-1 text-xs font-bold",
        isDown ? "text-destructive" : isOnHero ? "text-hero-positive" : "text-success-foreground",
      )}
    >
      <DesignIcon name={isDown ? "trainer-Down" : isOnHero ? "trainer-Trend" : "trainer-Trend1"} />
      {signed(change, unit)}
    </p>
  )
}

function Kpi({
  value,
  label,
  trend,
  isOnHero,
}: {
  value: string
  label: string
  trend: React.ReactNode
  isOnHero?: boolean
}) {
  return (
    <article
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-1.5 rounded-hero p-3.5",
        isOnHero ? "bg-hero text-hero-foreground" : "border border-border bg-card",
      )}
    >
      <p className="text-2xl leading-tight font-extrabold tabular-nums">{value}</p>
      <p
        className={cn(
          "text-xs font-semibold break-words",
          isOnHero ? "text-hero-muted" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
      {trend}
    </article>
  )
}

const ATTENTION_STYLE: Record<
  Attention["kind"],
  { icon: string; surface: string; action: string }
> = {
  inactive: { icon: "trainer-Clock", surface: "bg-warning", action: "Napsat" },
  "low-success": { icon: "trainer-Down1", surface: "bg-danger-surface", action: "Upravit" },
  reply: { icon: "trainer-Msg", surface: "bg-accent", action: "Odpovědět" },
}

function AttentionRow({ item }: { item: Attention }) {
  const style = ATTENTION_STYLE[item.kind]
  const actionLabel = `${style.action} – ${item.dog.name}`
  let action: React.ReactNode
  if (item.kind === "low-success") {
    action = (
      <Button
        asChild
        variant="secondary"
        className="shrink-0 rounded-field font-bold"
      >
        {item.goalId ? (
          <Link
            to="/dogs/$dogId/goals/$goalId"
            params={{ dogId: item.dog.id, goalId: item.goalId }}
            aria-label={actionLabel}
          >
            {style.action}
          </Link>
        ) : (
          <Link
            to="/dogs/$dogId"
            params={{ dogId: item.dog.id }}
            aria-label={actionLabel}
          >
            {style.action}
          </Link>
        )}
      </Button>
    )
  } else if (item.activityId) {
    action = (
      <Button
        asChild
        variant="secondary"
        className="shrink-0 rounded-field font-bold"
      >
        <Link
          to="/dogs/$dogId/activities/$activityId"
          params={{ dogId: item.dog.id, activityId: item.activityId }}
          aria-label={actionLabel}
        >
          {style.action}
        </Link>
      </Button>
    )
  } else {
    action = (
      <Button
        asChild
        variant="secondary"
        className="shrink-0 rounded-field font-bold"
      >
        <Link
          to="/clients/$clientId"
          params={{ clientId: item.client.id }}
          aria-label={actionLabel}
        >
          {style.action}
        </Link>
      </Button>
    )
  }
  return (
    <li className="flex items-center gap-3 rounded-card border border-border bg-card p-3">
      <span
        aria-hidden
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-field",
          style.surface,
        )}
      >
        <DesignIcon name={style.icon} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold break-words">
          {item.dog.name} · {item.client.name}
        </p>
        <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
      </div>
      {action}
    </li>
  )
}

function lastActivityLabel(client: OverviewClient, now: Date): string {
  const last = client.lastTraining
  if (!last) return client.dogs.length ? "Zatím bez tréninku" : "Zatím bez sdíleného psa"
  const days = differenceInCalendarDays(now, last.completedAt)
  const when = days <= 0 ? "Dnes" : days === 1 ? "Včera" : `Před ${days} dny`
  return `${when} · ${last.title}`
}

function Sparkline({ client }: { client: OverviewClient }) {
  const weeks = client.weeks.slice(-5)
  const color = dogColorClass(client.dogs[0]?.color ?? 1)
  return (
    <div
      role="img"
      aria-label={`Úspěšnost za posledních ${weeks.length} týdnů: ${weeks
        .map((week) =>
          week.successRate === null ? "bez hodnocení" : `${Math.round(week.successRate)} %`,
        )
        .join(", ")}`}
      className="flex h-6 shrink-0 items-end gap-0.5"
    >
      {weeks.map((week) => (
        <span
          key={week.from}
          className={cn("w-1.5 rounded-full", color)}
          style={{ height: `${Math.max(12, week.successRate ?? 12)}%` }}
        />
      ))}
    </div>
  )
}

function ClientRow({ client, now }: { client: OverviewClient; now: Date }) {
  return (
    <li>
      <Link
        to="/clients/$clientId"
        params={{ clientId: client.id }}
        className="flex min-h-touch items-center gap-3 rounded-card border border-border bg-card p-3 outline-hidden transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex shrink-0">
          {client.dogs.length ? (
            client.dogs.slice(0, 3).map((dog, index) => (
              <span
                key={dog.id}
                aria-label={dog.name}
                role="img"
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border-2 border-card text-xs font-extrabold text-dog-foreground",
                  dogColorClass(dog.color),
                  index > 0 && "-ml-1.5",
                )}
              >
                {dog.name.trim().charAt(0).toUpperCase()}
              </span>
            ))
          ) : (
            <span
              aria-hidden
              className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs text-muted-foreground"
            >
              –
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold">{client.name}</span>
          <span className="block truncate text-xs font-medium text-muted-foreground">
            {lastActivityLabel(client, now)}
          </span>
        </span>
        {client.dogs.length > 0 && <Sparkline client={client} />}
        <span className="w-10 shrink-0 text-right text-sm font-extrabold tabular-nums">
          {client.successRate === null ? "—" : `${Math.round(client.successRate)} %`}
        </span>
      </Link>
    </li>
  )
}

function PendingInvitations({ onInvite }: { onInvite: () => void }) {
  const query = useQuery(clientInvitationsQueryOptions())
  if (query.isLoading) return null
  if (query.isError) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-muted-foreground">Pozvánky teď nejde načíst.</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void query.refetch()}
        >
          Zkusit znovu
        </Button>
      </div>
    )
  }
  const invitations = query.data ?? []
  if (!invitations.length) return null
  return (
    <section
      aria-labelledby="overview-invitations-heading"
      className="flex flex-col gap-2.5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="overview-invitations-heading"
          className="text-section font-extrabold"
        >
          Čekající pozvánky
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="font-bold text-primary"
          onClick={onInvite}
        >
          <UserPlus
            className="size-4"
            aria-hidden
          />
          Pozvat
        </Button>
      </div>
      <ul className="flex flex-col gap-2">
        {invitations.map((invitation) => (
          <li
            key={invitation.id}
            className="flex items-center justify-between gap-3 rounded-card border border-border bg-card px-4 py-3"
          >
            <span className="min-w-0 truncate text-sm font-semibold">
              {invitation.email ?? "Pozvánka kódem"}
            </span>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              {invitation.code}
            </span>
          </li>
        ))}
      </ul>
      <Link
        to={ROUTES.clients}
        className="min-h-touch text-sm font-bold text-primary underline-offset-4 hover:underline"
      >
        Spravovat pozvánky v Klientech
      </Link>
    </section>
  )
}

function OverviewShortcuts() {
  return (
    <nav
      aria-label="Rychlé odkazy"
      className="grid gap-2"
    >
      {[{ to: ROUTES.clients, label: "Klienti", icon: Users }].map(({ to, label, icon: Icon }) => (
        <Button
          key={to}
          asChild
          variant="outline"
          className="bg-card"
        >
          <Link to={to}>
            <Icon
              className="size-4"
              aria-hidden
            />
            {label}
          </Link>
        </Button>
      ))}
    </nav>
  )
}

export function TrainerOverview({ userName }: { userName?: string }) {
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const query = useQuery(trainerOverviewQueryOptions())
  const now = new Date()
  const today = todayCalendarDate()
  const dayHeading = formatDayLong(today)
  const data = query.data
  const metrics = data?.metrics

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-gutter pt-3 pb-6 md:py-8">
      <header className="flex items-center gap-2.5">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-label font-semibold text-muted-foreground">
            {dayHeading.charAt(0).toUpperCase() + dayHeading.slice(1)}
          </p>
          <h1 className="text-page leading-tight font-extrabold tracking-tight">
            {userName ? `${greeting(now)}, ${firstName(userName)}` : "Přehled"}
          </h1>
        </div>
      </header>

      <QueryState
        isLoading={query.isLoading}
        error={query.error}
        isEmpty={false}
        empty={null}
        onRetry={() => void query.refetch()}
        loadingLabel="Načítání přehledu"
        errorTitle="Přehled se nepodařilo načíst"
        errorDescription="Zkontrolujte připojení a zkuste to znovu."
      >
        {data && metrics && (
          <div className="flex flex-col gap-6">
            <section
              aria-label="Metriky"
              className="flex gap-2.5"
            >
              <Kpi
                isOnHero
                value={String(metrics.activeClients)}
                label="aktivních klientů"
                trend={
                  <Trend
                    isOnHero
                    change={metrics.newClientsThisMonth}
                    unit=" za měsíc"
                  />
                }
              />
              <Kpi
                value={String(metrics.completedThisWeek)}
                label="tréninků tento týden"
                trend={
                  <Trend
                    change={metrics.weeklySessionChange}
                    unit=""
                  />
                }
              />
              <Kpi
                value={metrics.successRate === null ? "—" : `${Math.round(metrics.successRate)} %`}
                label="průměrná úspěšnost"
                trend={
                  metrics.weeklyRateChange === null ? (
                    <p className="text-xs font-medium text-muted-foreground">bez srovnání</p>
                  ) : (
                    <Trend
                      change={metrics.weeklyRateChange}
                      unit=" b."
                    />
                  )
                }
              />
            </section>

            <section
              aria-labelledby="overview-attention-heading"
              className="flex flex-col gap-2.5"
            >
              <div className="flex items-center gap-3">
                <h2
                  id="overview-attention-heading"
                  className="flex-1 text-section font-extrabold"
                >
                  Potřebuje pozornost
                </h2>
                {data.attention.length > 0 && (
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-primary-foreground">
                    {data.attention.length}
                  </span>
                )}
              </div>
              {data.attention.length ? (
                <ul className="flex flex-col gap-2.5">
                  {data.attention.map((item) => (
                    <AttentionRow
                      key={item.id}
                      item={item}
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nikdo teď nečeká na odpověď, všichni psi trénují a drží úspěšnost.
                </p>
              )}
            </section>

            <section
              aria-labelledby="overview-clients-heading"
              className="flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between gap-3">
                <h2
                  id="overview-clients-heading"
                  className="text-section font-extrabold"
                >
                  Klienti
                </h2>
                {data.clients.length > 0 && (
                  <Link
                    to={ROUTES.clients}
                    className="flex min-h-touch items-center text-sm font-bold text-primary"
                  >
                    Všech {data.clients.length}
                  </Link>
                )}
              </div>
              {data.clients.length === 0 ? (
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
                <ul className="flex flex-col gap-2.5">
                  {data.clients.slice(0, 5).map((client) => (
                    <ClientRow
                      key={client.id}
                      client={client}
                      now={now}
                    />
                  ))}
                </ul>
              )}
            </section>

            <PendingInvitations onInvite={() => setIsInviteOpen(true)} />
          </div>
        )}
      </QueryState>

      {/* Secondary navigation stays reachable even when the overview fails (#182). */}
      <OverviewShortcuts />

      <InviteClientDialog
        isOpen={isInviteOpen}
        onOpenChange={setIsInviteOpen}
      />
    </div>
  )
}
