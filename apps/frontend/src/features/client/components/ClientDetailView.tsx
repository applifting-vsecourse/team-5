import { useQueries, useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { PawPrint } from "lucide-react"

import { DesignIcon } from "@/components/DesignIcon"
import { EmptyState } from "@/components/EmptyState"
import { Button } from "@/components/ui/button"
import { dogColorClass } from "@/lib/dogColors"
import { dogMetricsQueryOptions } from "@/lib/dogMetrics"
import { dogHistoryFirstPageQueryOptions } from "@/lib/history"
import { formatHistoryTime } from "@/lib/historyDate"
import { cn } from "@/lib/utils"

import { clientDogGoalsQueryOptions } from "@/features/client/api/clientDogGoals"
import type { Client } from "@/features/client/api/clientSchemas"
import { trainerOverviewQueryOptions } from "@/features/client/api/trainerOverview"

type ClientDetailViewProps = {
  client: Client
  onSchedule?: () => void
}

export function ClientDetailView({ client, onSchedule }: ClientDetailViewProps) {
  const overview = useQuery(trainerOverviewQueryOptions())
  const metricsQueries = useQueries({
    queries: client.dogs.map((dog) => ({
      ...dogMetricsQueryOptions(dog.id),
    })),
  })
  const historyQueries = useQueries({
    queries: client.dogs.map((dog) => dogHistoryFirstPageQueryOptions(dog.id)),
  })
  const primaryDog = client.dogs[0]
  const goalsQuery = useQuery(clientDogGoalsQueryOptions(primaryDog?.id ?? ""))
  const activeGoal = (goalsQuery.data ?? []).find((goal) => goal.status === "ACTIVE")
  const recentRecords = [
    ...new Map(
      historyQueries.flatMap((query) => query.data?.items ?? []).map((item) => [item.id, item]),
    ).values(),
  ]
    .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
    .slice(0, 5)
  const replyActivityIds = new Set(
    (overview.data?.attention ?? [])
      .filter((item) => item.client.id === client.id && item.kind === "reply" && item.activityId)
      .map((item) => item.activityId!),
  )

  return (
    <div className="flex flex-col gap-6">
      <nav
        aria-label="Navigace klienta"
        className="flex items-center gap-3"
      >
        <Button
          asChild
          variant="outline"
          size="icon"
          className="rounded-field bg-card"
        >
          <Link
            to="/clients"
            aria-label="Zpět na seznam klientů"
          >
            <DesignIcon name="client-ChevL" />
          </Link>
        </Button>
        <p className="flex-1 text-center text-sm font-bold">Klient</p>
        <span
          aria-hidden
          className="w-touch"
        />
      </nav>

      <header className="space-y-4 rounded-card border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-extrabold text-primary-foreground"
          >
            {client.name
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part.charAt(0).toUpperCase())
              .join("") || "?"}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold tracking-tight break-words">{client.name}</h1>
            <p className="text-xs font-medium break-all text-muted-foreground">{client.email}</p>
          </div>
        </div>
        {client.dogs.length > 0 && (
          <Button
            className="min-h-touch w-full rounded-control font-bold"
            onClick={onSchedule}
          >
            <DesignIcon name="client-Cal" />
            Naplánovat
          </Button>
        )}
      </header>

      <section
        aria-label="Sdílení psi"
        className="space-y-3"
      >
        <h2 className="text-section font-extrabold">Psi</h2>
        {client.dogs.length === 0 ? (
          <EmptyState
            icon={PawPrint}
            chip="BEZ PSA"
            title="Klient s vámi zatím nesdílí žádného psa"
            description="Až klient nasdílí psa, uvidíte tady jeho profil a můžete pokračovat k plánu nebo záznamu."
            titleAs="p"
          />
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {client.dogs.map((dog, index) => {
              const rate = metricsQueries[index]?.data?.successRate
              return (
                <li key={dog.id}>
                  <Link
                    to="/dogs/$dogId"
                    params={{ dogId: dog.id }}
                    className={cn(
                      "flex min-h-touch flex-col gap-2 rounded-card p-4 text-dog-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
                      dogColorClass(dog.color),
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span
                        aria-hidden
                        className="flex size-8 items-center justify-center rounded-full border border-dog-foreground text-sm font-extrabold"
                      >
                        {dog.name.charAt(0)}
                      </span>
                      <span className="text-sm font-extrabold tabular-nums">
                        {rate == null ? "—" : `${Math.round(rate)} %`}
                      </span>
                    </span>
                    <span className="text-lg font-extrabold break-words">{dog.name}</span>
                    <span className="text-xs font-medium">
                      {[dog.breed, dog.disciplines?.join(" · ")].filter(Boolean).join(" · ") ||
                        "Bez detailů"}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {activeGoal && primaryDog ? (
        <section
          aria-labelledby="client-active-goal"
          className="space-y-3 rounded-card bg-hero p-4 text-hero-foreground"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                id="client-active-goal"
                className="text-xs font-extrabold tracking-wide text-hero-muted uppercase"
              >
                Aktivní cíl · {primaryDog.name}
                {activeGoal.discipline ? ` · ${activeGoal.discipline}` : ""}
              </p>
              <h2 className="mt-1 text-lg font-extrabold break-words">{activeGoal.title}</h2>
            </div>
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="shrink-0 font-bold"
            >
              <Link
                to="/dogs/$dogId/goals/$goalId"
                params={{ dogId: primaryDog.id, goalId: activeGoal.id }}
              >
                Upravit
              </Link>
            </Button>
          </div>
          {activeGoal.criterion && (
            <p className="text-sm text-hero-muted">Hotovo, když: {activeGoal.criterion}</p>
          )}
        </section>
      ) : null}

      <section
        aria-labelledby="client-recent-records"
        className="space-y-3"
      >
        <h2
          id="client-recent-records"
          className="text-section font-extrabold"
        >
          Poslední záznamy
        </h2>
        {recentRecords.length === 0 ? (
          <p className="text-sm text-muted-foreground">Zatím žádné záznamy u sdílených psů.</p>
        ) : (
          <ul className="space-y-2">
            {recentRecords.map((record) => (
              <li key={record.id}>
                <Link
                  to="/dogs/$dogId/activities/$activityId"
                  params={{ dogId: record.dog.id, activityId: record.id }}
                  className="flex min-h-touch items-start gap-3 rounded-card border border-border bg-card p-3 outline-hidden hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mt-1.5 w-1 shrink-0 self-stretch rounded-full",
                      dogColorClass(record.dog.color),
                    )}
                  />
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="block text-sm font-extrabold break-words">{record.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {record.dog.name} · {formatHistoryTime(record.completedAt)}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    {replyActivityIds.has(record.id) && (
                      <span className="rounded-full bg-danger-surface px-2 py-0.5 text-xs font-extrabold text-danger-foreground">
                        nový
                      </span>
                    )}
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-extrabold",
                        record.status === "SKIPPED"
                          ? "bg-secondary text-muted-foreground"
                          : "bg-success text-success-foreground",
                      )}
                    >
                      {record.status === "SKIPPED"
                        ? "Přeskočeno"
                        : record.successRate == null
                          ? "Hotovo"
                          : `${record.successRate} %`}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
