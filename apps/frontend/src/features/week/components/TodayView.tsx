import { useQueries, useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Calendar, PawPrint, Play } from "lucide-react"

import { EmptyState } from "@/components/EmptyState"
import { HeroCard, HeroChip } from "@/components/HeroCard"
import { Metric } from "@/components/Metric"
import { QueryState } from "@/components/QueryState"
import { StripCard } from "@/components/StripCard"
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

import {
  upcomingTrainingsQueryOptions,
  weekTrainingsQueryOptions,
  type WeekTraining,
} from "@/features/week/api/weekQueryOptions"
import { pickNextTraining } from "@/features/week/lib/pickNextTraining"

const exerciseCount = (count: number): string => {
  if (count === 1) return "1 cvik"
  if (count >= 2 && count <= 4) return `${count} cviky`
  return `${count} cviků`
}

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
  streak?: number | null
  successRate?: number | null
  weeklyTrainedDays?: number | null
  weeklyTarget?: number | null
}

function NextTrainingHero({
  training,
  today,
  streak,
  successRate,
  weeklyTrainedDays,
  weeklyTarget,
}: NextTrainingHeroProps) {
  const isToday = training.date === today
  const titles = training.exercises.map((exercise) => exercise.title)
  const hasHeroMetrics =
    streak != null ||
    successRate != null ||
    (weeklyTrainedDays != null && weeklyTarget != null)

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

      <div className="space-y-1">
        <h2 className="text-xl font-extrabold tracking-tight text-hero-foreground">
          {training.goal.title}
        </h2>
        <p className="text-sm font-medium text-hero-muted">
          {titles.length === 0
            ? "Plán zatím nemá žádný cvik."
            : `${exerciseCount(titles.length)} · ${titles.slice(0, 5).join(", ")}`}
        </p>
      </div>

      {hasHeroMetrics ? (
        <div className="flex flex-wrap gap-6">
          {weeklyTrainedDays != null && weeklyTarget != null ? (
            <Metric
              isOnHero
              value={`${weeklyTrainedDays}/${weeklyTarget}`}
              label="týdenní cíl"
            />
          ) : null}
          {streak != null ? (
            <Metric
              isOnHero
              value={streak}
              label="série"
            />
          ) : null}
          {successRate != null ? (
            <Metric
              isOnHero
              value={`${successRate} %`}
              label="úspěšnost"
            />
          ) : null}
        </div>
      ) : null}

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
  const completedCount = weekTrainings.filter((training) => training.status === "COMPLETED").length
  const totalCount = weekTrainings.length
  const remainingPlanned = weekTrainings.filter((training) => training.status === "PLANNED").length
  const remainingLabel =
    remainingPlanned === 1
      ? "zbývá trénink"
      : remainingPlanned >= 2 && remainingPlanned <= 4
        ? "zbývají tréninky"
        : "zbývá tréninků"

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
              streak={nextMetrics?.streak}
              successRate={nextMetrics?.successRate ?? null}
              weeklyTrainedDays={nextMetrics?.weeklyTrainedDays}
              weeklyTarget={nextMetrics?.weeklyTarget}
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

          {totalCount > 0 ? (
            <section
              aria-labelledby="today-week-progress"
              className="flex flex-col gap-3"
            >
              <h2
                id="today-week-progress"
                className="text-section font-extrabold tracking-tight text-foreground"
              >
                Tento týden
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Metric
                  value={`${completedCount}/${totalCount}`}
                  label="odcvičeno tento týden"
                />
                <Metric
                  value={remainingPlanned}
                  label={remainingLabel}
                />
              </div>
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
              <ul className="flex flex-col gap-2">
                {dogs.map((dog) => {
                  const nextForDog = pickNextTraining(
                    upcomingTrainings.filter((training) => training.dog.id === dog.id),
                    today,
                  )
                  const metrics = metricsByDogId.get(dog.id)
                  const planSubtitle = nextForDog
                    ? nextForDog.date === today
                      ? `Dnes · ${nextForDog.goal.title}`
                      : `${formatDayLong(nextForDog.date)} · ${nextForDog.goal.title}`
                    : "Bez naplánovaného tréninku"
                  const metricBits = [
                    metrics ? `série ${metrics.streak}` : null,
                    metrics?.successRate != null ? `${metrics.successRate} %` : null,
                  ].filter(Boolean)
                  const subtitle =
                    metricBits.length > 0 ? `${planSubtitle} · ${metricBits.join(" · ")}` : planSubtitle
                  return (
                    <StripCard
                      key={dog.id}
                      as="li"
                      dogColor={dog.color}
                    >
                      <Link
                        to="/dogs/$dogId"
                        params={{ dogId: dog.id }}
                        className="flex min-h-16 items-center justify-between gap-3 p-4 outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{dog.name}</p>
                          <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
                        </div>
                        <PawPrint
                          className="size-5 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                      </Link>
                    </StripCard>
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
