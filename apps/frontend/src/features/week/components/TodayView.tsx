import { useQueries, useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Calendar, Play } from "lucide-react"

import { EmptyState } from "@/components/EmptyState"
import { HeroCard, HeroChip } from "@/components/HeroCard"
import { QueryState } from "@/components/QueryState"
import { Button } from "@/components/ui/button"
import {
  addCalendarDays,
  formatDayLong,
  startOfWeekOf,
  todayCalendarDate,
  type CalendarDate,
} from "@/lib/calendarDate"
import { dogColorClass } from "@/lib/dogColors"
import { dogMetricsQueryOptions } from "@/lib/dogMetrics"
import { dogsListQueryOptions } from "@/lib/dogsListQueryOptions"
import { cn } from "@/lib/utils"

import { DogPlayerCard } from "@/components/DogPlayerCard"
import {
  upcomingTrainingsQueryOptions,
  weekTrainingsQueryOptions,
  type WeekTraining,
} from "@/features/week/api/weekQueryOptions"
import { pickNextTraining } from "@/features/week/lib/pickNextTraining"

function firstName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  return parts[0] ?? fullName
}

function formatDayHeading(today: CalendarDate): string {
  const raw = formatDayLong(today)
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

type NextTrainingHeroProps = {
  training: WeekTraining
  today: CalendarDate
}

function NextTrainingHero({ training, today }: NextTrainingHeroProps) {
  const isToday = training.date === today

  return (
    <HeroCard eyebrow={isToday ? "Dnešní trénink" : "Další trénink"}>
      <div className="flex flex-wrap items-center gap-2">
        <HeroChip>
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className={cn("size-2 rounded-full", dogColorClass(training.dog.color))}
            />
            {training.dog.name}
          </span>
        </HeroChip>
        {!isToday ? (
          <span className="text-xs font-semibold text-hero-muted">
            {formatDayLong(training.date)}
          </span>
        ) : null}
      </div>

      <h2 className="text-xl font-extrabold tracking-tight text-hero-foreground">
        {training.goal.title}
      </h2>
      {training.exercises.length > 0 ? (
        <ol className="flex flex-col gap-2">
          {training.exercises.map((exercise, index) => (
            <li
              key={exercise.id}
              className="rounded-full bg-hero-accent px-3 py-2 text-sm font-semibold text-hero-foreground"
            >
              {index + 1} {exercise.title}
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm font-medium text-hero-muted">Plán zatím nemá žádný cvik.</p>
      )}

      <Button
        asChild
        size="lg"
        className="mt-1 w-full"
      >
        <Link
          to="/trainings/$trainingId"
          params={{ trainingId: training.id }}
        >
          <Play
            className="size-4"
            aria-hidden
          />
          Začít trénink
        </Link>
      </Button>
    </HeroCard>
  )
}

type TodayViewProps = {
  userName?: string
}

export function TodayView({ userName }: TodayViewProps) {
  const today = todayCalendarDate()
  const weekStart = startOfWeekOf(today)
  const upcomingFrom = addCalendarDays(weekStart, -7)

  const weekQuery = useQuery(weekTrainingsQueryOptions(weekStart))
  const upcomingQuery = useQuery(upcomingTrainingsQueryOptions(upcomingFrom))
  const dogsQuery = useQuery(dogsListQueryOptions())

  const weekTrainings = weekQuery.data ?? []
  const upcomingTrainings = upcomingQuery.data ?? weekTrainings
  const nextTraining = pickNextTraining(upcomingTrainings, today)
  const dogs = dogsQuery.data ?? []
  const metricsQueries = useQueries({
    queries: dogs.map((dog) => ({
      ...dogMetricsQueryOptions(dog.id),
      enabled: dogsQuery.isSuccess && Boolean(dog.id),
    })),
  })
  const metricsByDogId = new Map(
    dogs.map((dog, index) => [dog.id, metricsQueries[index]?.data] as const),
  )
  const nextMetrics = nextTraining ? metricsByDogId.get(nextTraining.dog.id) : undefined

  const isLoading = weekQuery.isLoading || dogsQuery.isLoading
  const error = weekQuery.error ?? dogsQuery.error ?? upcomingQuery.error

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 md:py-8">
      <header className="space-y-1">
        <p className="text-sm font-semibold text-muted-foreground">{formatDayHeading(today)}</p>
        <h1 className="text-page font-extrabold tracking-tight text-foreground">
          {userName ? `Ahoj ${firstName(userName)}` : "Dnes"}
        </h1>
      </header>

      <QueryState
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          void weekQuery.refetch()
          void upcomingQuery.refetch()
          void dogsQuery.refetch()
        }}
        isEmpty={!nextTraining && weekTrainings.length === 0 && dogs.length === 0}
        errorTitle="Dnes se nepodařilo načíst"
        empty={
          <EmptyState
            icon={Calendar}
            chip="BEZ PLÁNU"
            title="Na dnes nic naplánováno"
            description="Založte psovi cíl a naplánujte trénink, nebo počkejte, až vám ho zadá trenér."
            action={
              <Button
                asChild
                size="lg"
                className="w-full"
              >
                <Link to="/dogs">Přejít na psy</Link>
              </Button>
            }
          />
        }
      >
        <div className="flex flex-col gap-6">
          {nextTraining ? (
            <NextTrainingHero
              training={nextTraining}
              today={today}
            />
          ) : (
            <EmptyState
              icon={Calendar}
              chip="HOTOVO"
              title="Dnes máte volno"
              description="Nemáte další naplánovaný trénink. Podívejte se na týden nebo na psy."
              action={
                <Button
                  asChild
                  size="lg"
                  className="w-full"
                >
                  <Link to="/week">Otevřít týden</Link>
                </Button>
              }
              secondaryAction={
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  <Link to="/dogs">Přejít na psy</Link>
                </Button>
              }
            />
          )}

          {nextMetrics ? (
            <section
              aria-label="Metriky"
              className="grid grid-cols-3 gap-2"
            >
              <article className="rounded-card border border-border bg-card p-3">
                <p className="text-label text-muted-foreground">Týdenní cíl</p>
                <p className="text-title font-extrabold tabular-nums">
                  {nextMetrics.weeklyTrainedDays}/{nextMetrics.weeklyTarget}
                </p>
              </article>
              <article className="rounded-card border border-border bg-card p-3">
                <p className="text-label text-muted-foreground">Série</p>
                <p className="text-title font-extrabold tabular-nums">{nextMetrics.streak}</p>
              </article>
              <article className="rounded-card border border-border bg-card p-3">
                <p className="text-label text-muted-foreground">Úspěšnost</p>
                <p className="text-title font-extrabold tabular-nums">
                  {nextMetrics.successRate != null
                    ? `${Math.round(nextMetrics.successRate)} %`
                    : "—"}
                </p>
                {nextMetrics.weeklyChange != null ? (
                  <p className="text-sm font-semibold text-success-foreground">
                    {nextMetrics.weeklyChange > 0 ? "+" : ""}
                    {nextMetrics.weeklyChange} b.
                  </p>
                ) : null}
              </article>
            </section>
          ) : null}

          {dogs.length > 0 ? (
            <section
              aria-labelledby="today-dogs-heading"
              className="flex flex-col gap-3"
            >
              <h2
                id="today-dogs-heading"
                className="text-section font-extrabold tracking-tight text-foreground"
              >
                Tvoji psi
              </h2>
              <ul className="flex flex-col gap-3">
                {dogs.map((dog) => {
                  const nextForDog = pickNextTraining(
                    upcomingTrainings.filter((training) => training.dog.id === dog.id),
                    today,
                  )
                  const nextLabel = nextForDog
                    ? nextForDog.date === today
                      ? `Dnes · ${nextForDog.goal.title}`
                      : `${formatDayLong(nextForDog.date)} · ${nextForDog.goal.title}`
                    : null
                  return (
                    <li key={dog.id}>
                      <DogPlayerCard
                        dog={dog}
                        metrics={metricsByDogId.get(dog.id) ?? null}
                        nextLabel={nextLabel}
                      />
                    </li>
                  )
                })}
              </ul>
            </section>
          ) : null}
        </div>
      </QueryState>
    </div>
  )
}
