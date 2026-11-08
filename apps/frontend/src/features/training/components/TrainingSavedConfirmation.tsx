import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { toast } from "sonner"

import { DesignIcon } from "@/components/DesignIcon"
import { PesAvatar } from "@/components/PesAvatar"
import { ProgressRing } from "@/components/ProgressRing"
import { QueryState } from "@/components/QueryState"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  daysOfWeek,
  formatDayLong,
  formatWeekdayShort,
  startOfWeekOf,
  todayCalendarDate,
} from "@/lib/calendarDate"
import { dogMetricsQueryOptions } from "@/lib/dogMetrics"
import { cn } from "@/lib/utils"
import { upcomingTrainingsQueryOptions } from "@/lib/weekTrainings"

import { trainingDetailQueryOptions } from "@/features/training/api/trainingsQueryOptions"

export function TrainingSavedConfirmation({ trainingId }: { trainingId: string }) {
  const trainingQuery = useQuery(trainingDetailQueryOptions(trainingId))
  const dog = trainingQuery.data?.dog
  const metricsQuery = useQuery(dogMetricsQueryOptions(dog?.id ?? ""))
  const upcoming = useQuery({
    ...upcomingTrainingsQueryOptions(todayCalendarDate()),
    enabled: trainingQuery.isSuccess,
  })
  const [isSharing, setSharing] = useState(false)
  const metrics = metricsQuery.isSuccess ? metricsQuery.data : undefined
  const streak = metrics?.streak ?? 0
  const next = upcoming.data
    ?.filter((item) => item.status === "PLANNED" && item.id !== trainingId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))[0]
  const planned = metrics?.weeklyPlannedSessions ?? 0
  const completed = metrics?.weeklyCompletedSessions ?? 0
  const isPlanDone = planned > 0 && completed >= planned

  const share = async () => {
    if (isSharing) return
    setSharing(true)
    try {
      const data = {
        title: "TrainLoop",
        text: `Trénink ${dog?.name ?? ""} je zaznamenaný.`,
        url: new URL(`/trainings/${trainingId}`, window.location.origin).href,
      }
      if (navigator.share) await navigator.share(data)
      else {
        await navigator.clipboard.writeText(data.url)
        toast.success("Odkaz na trénink je zkopírovaný.")
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        toast.error("Odkaz se nepodařilo sdílet.")
      }
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="min-h-dvh bg-primary text-primary-foreground">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-gutter py-8">
        <header className="space-y-3 py-4 text-center">
          <div
            aria-hidden
            className="text-6xl"
          >
            {streak > 0 ? "🔥" : "✓"}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            {streak > 0
              ? `${streak} ${streak === 1 ? "den" : streak <= 4 ? "dny" : "dní"} v řadě!`
              : "Záznam byl uložen"}
          </h1>
          <p className="text-base">
            {dog ? `Trénink psa ${dog.name} je zaznamenaný.` : "Trénink je zaznamenaný."}
          </p>
          {metrics?.longestStreak != null && metrics.longestStreak > 0 && (
            <p className="text-sm">
              Rekord: {metrics.longestStreak}{" "}
              {metrics.longestStreak === 1 ? "den" : metrics.longestStreak <= 4 ? "dny" : "dní"} v
              řadě.
            </p>
          )}
        </header>
        {metricsQuery.isLoading && (
          <Skeleton
            className="h-24 w-full bg-primary-foreground/20"
            aria-label="Načítání výsledků"
          />
        )}
        {metricsQuery.isError && (
          <div
            role="alert"
            className="text-center text-sm"
          >
            <p>Trénink je uložený. Výsledky se nepodařilo načíst.</p>
            <Button
              variant="outline"
              className="mt-2 bg-card text-foreground"
              onClick={() => void metricsQuery.refetch()}
            >
              Zkusit znovu
            </Button>
          </div>
        )}
        {metrics?.trainedDates && (
          <ol
            className="grid grid-cols-7 gap-1 text-center"
            aria-label="Odcvičené dny tohoto týdne"
          >
            {daysOfWeek(startOfWeekOf(metrics.asOf)).map((day) => {
              const isDone = metrics.trainedDates?.includes(day)
              return (
                <li
                  key={day}
                  className="flex flex-col items-center gap-2"
                  aria-label={`${formatDayLong(day)}: ${isDone ? "odcvičeno" : "bez tréninku"}`}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full",
                      isDone ? "bg-card" : "border border-dashed border-primary-foreground",
                    )}
                  >
                    {isDone && <DesignIcon name="saved-Check" />}
                  </span>
                  <span className="text-xs font-semibold">{formatWeekdayShort(day)}</span>
                </li>
              )
            })}
          </ol>
        )}
        {metrics && (
          <section
            className="flex items-center gap-4 rounded-hero bg-card p-5 text-card-foreground"
            aria-label="Výsledek týdne"
          >
            <ProgressRing
              value={completed}
              target={planned}
              label="Hotové z týdenního plánu"
              tone={isPlanDone ? "success" : "primary"}
              size="lg"
            />
            <div className="min-w-0 space-y-1">
              <h2 className="flex items-center gap-2 text-base font-extrabold">
                {isPlanDone && <DesignIcon name="saved-Trophy" />}
                {isPlanDone ? "Týdenní plán splněn" : "Týdenní plán"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {planned > 0
                  ? `${completed} z ${planned} tréninků hotovo`
                  : "Na tento týden nejsou naplánované tréninky."}
              </p>
              {metrics.weeks.at(-1)?.successRate != null && (
                <p className="text-xs text-muted-foreground">
                  Průměrná úspěšnost v týdnu {Math.round(metrics.weeks.at(-1)!.successRate!)} %
                </p>
              )}
            </div>
          </section>
        )}
        <QueryState
          isLoading={upcoming.isLoading}
          error={upcoming.error}
          onRetry={() => void upcoming.refetch()}
          empty={null}
          skeleton={<Skeleton className="h-32 w-full bg-primary-foreground/20" />}
          errorTitle="Další trénink se nepodařilo načíst"
        >
          {next ? (
            <section
              className="space-y-4 rounded-hero bg-hero p-5 text-hero-foreground"
              aria-label="Další trénink"
            >
              <h2 className="text-xs font-extrabold tracking-wide text-hero-muted uppercase">
                Další na řadě
              </h2>
              <div className="flex items-center gap-3">
                <PesAvatar
                  name={next.dog.name}
                  color={next.dog.color}
                  className="size-11"
                />
                <div className="min-w-0">
                  <p className="font-extrabold break-words">
                    {next.training?.title ?? next.goal.title}
                  </p>
                  <p className="text-sm text-hero-muted">
                    {next.dog.name} · {formatDayLong(next.date)}
                  </p>
                </div>
              </div>
              <Button
                asChild
                variant="secondary"
                className="w-full bg-hero-accent text-hero-foreground hover:bg-hero-accent/80"
              >
                <Link
                  to="/week"
                  search={{ tyden: startOfWeekOf(next.date) }}
                >
                  <DesignIcon name="saved-Cal" />
                  Zobrazit v týdnu
                </Link>
              </Button>
            </section>
          ) : upcoming.isSuccess ? (
            <p className="text-center text-sm">
              Na dalších šest týdnů nemáš naplánovaný další trénink.
            </p>
          ) : null}
        </QueryState>
        <div className="flex flex-col gap-2.5">
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="w-full bg-card text-primary hover:bg-card/90"
          >
            <Link to="/week">Pokračovat</Link>
          </Button>
          {dog?.hasTrainer && (
            <Button
              size="lg"
              variant="outline"
              className="w-full border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              disabled={isSharing}
              onClick={() => void share()}
            >
              <DesignIcon name="saved-Share" />
              {isSharing ? "Sdílím…" : "Sdílet s trenérem"}
            </Button>
          )}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link
              to="/dashboard"
              className="inline-flex min-h-touch items-center underline"
            >
              Na přehled
            </Link>
            {dog && (
              <Link
                to="/dogs/$dogId"
                params={{ dogId: dog.id }}
                className="inline-flex min-h-touch items-center underline"
              >
                Profil {dog.name}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
