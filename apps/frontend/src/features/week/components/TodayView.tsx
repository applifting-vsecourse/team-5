import { useQueries, useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Calendar } from "lucide-react"

import { ClickerToolDialog } from "@/components/ClickerToolDialog"
import { DesignIcon } from "@/components/DesignIcon"
import { dayLabel, DogPlayerCard } from "@/components/DogPlayerCard"
import { EmptyState } from "@/components/EmptyState"
import { ProgressRing } from "@/components/ProgressRing"
import { QueryState } from "@/components/QueryState"
import { useTrainingUpdates } from "@/components/TrainingUpdates"
import { Button } from "@/components/ui/button"
import { UnreadReplyList } from "@/components/UnreadReplies"
import {
  addCalendarDays,
  formatDayLong,
  startOfWeekOf,
  todayCalendarDate,
  type CalendarDate,
} from "@/lib/calendarDate"
import { dogColorClass } from "@/lib/dogColors"
import { dogMetricsQueryOptions, ownerMetricsQueryOptions } from "@/lib/dogMetrics"
import { dogsListQueryOptions } from "@/lib/dogsListQueryOptions"
import { cn } from "@/lib/utils"

import {
  upcomingTrainingsQueryOptions,
  weekTrainingsQueryOptions,
  type WeekTraining,
} from "@/features/week/api/weekQueryOptions"
import { LogFreeTrainingDialog } from "@/features/week/components/LogFreeTrainingDialog"
import { TodayWeekPreview } from "@/features/week/components/TodayWeekPreview"
import { pickNextTraining, pickTodayHeroTraining } from "@/features/week/lib/pickNextTraining"

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
  const isOverdue = training.date < today
  const chip = isToday ? "Dnešní trénink" : isOverdue ? "Zmeškaný trénink" : "Další trénink"

  return (
    <section
      className={cn(
        "grid gap-4 rounded-hero p-5 text-dog-foreground xl:grid-cols-2 xl:gap-x-7 xl:rounded-sheet xl:p-7",
        dogColorClass(training.dog.color),
      )}
      aria-label={chip}
    >
      <div className="flex flex-wrap items-center gap-2 xl:col-start-1">
        <span className="rounded-full bg-dog-foreground px-3 py-1.5 text-xs font-extrabold text-foreground uppercase">
          {chip}
        </span>
        <span className="rounded-full bg-dog-foreground/15 px-3 py-1.5 text-xs font-semibold">
          {training.dog.name}
        </span>
        {isOverdue && (
          <span className="text-xs font-semibold text-dog-foreground/80">
            {formatDayLong(training.date)}
          </span>
        )}
      </div>
      <div className="space-y-1.5 xl:col-start-1">
        <h2 className="text-hero-title leading-tight font-extrabold tracking-tight break-words xl:text-title">
          {training.training?.title ?? training.goal.title}
        </h2>
        <p className="text-sm font-medium text-dog-foreground/80">
          {[
            training.goal.discipline,
            training.training?.title !== training.goal.title ? training.goal.title : null,
          ]
            .filter(Boolean)
            .join(" › ")}
          {training.training?.total
            ? ` · trénink ${(training.training.position ?? 0) + 1}/${training.training.total}`
            : ""}
        </p>
      </div>
      {training.exercises.length ? (
        <ol className="flex flex-wrap gap-2 xl:col-start-2 xl:row-span-3 xl:row-start-1 xl:flex-col">
          {training.exercises.map((exercise, index) => (
            <li
              key={exercise.id}
              className="flex max-w-full items-start gap-2 rounded-full bg-dog-foreground/15 py-1.5 pr-3 pl-1.5 text-xs font-semibold"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-dog-foreground/25 text-xs font-extrabold">
                {index + 1}
              </span>
              <span className="min-w-0 break-words">{exercise.title}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-dog-foreground/80">Plán zatím nemá žádný cvik.</p>
      )}
      <Button
        asChild
        size="lg"
        className="w-full text-action font-bold xl:col-start-1"
      >
        <Link
          to="/trainings/$trainingId"
          params={{ trainingId: training.id }}
          search={{ zpet: "dnes" }}
          aria-label={`Začít trénink: ${training.dog.name}, ${training.training?.title ?? training.goal.title}`}
        >
          <DesignIcon name="today-Play" />
          Začít trénink
        </Link>
      </Button>
    </section>
  )
}

type TodayViewProps = {
  userName?: string
  userId?: string | null
  isSessionPending?: boolean
}

export function TodayView({ userName, userId, isSessionPending }: TodayViewProps) {
  const updates = useTrainingUpdates({ id: userId, isPending: isSessionPending })
  const today = todayCalendarDate()
  const weekStart = startOfWeekOf(today)
  const upcomingFrom = addCalendarDays(weekStart, -7)

  const weekQuery = useQuery(weekTrainingsQueryOptions(weekStart))
  const upcomingQuery = useQuery(upcomingTrainingsQueryOptions(upcomingFrom))
  const dogsQuery = useQuery(dogsListQueryOptions())
  const ownerMetrics = useQuery(ownerMetricsQueryOptions())

  const weekTrainings = weekQuery.data ?? []
  const upcomingTrainings = upcomingQuery.data ?? weekTrainings
  const heroTraining = pickTodayHeroTraining(upcomingTrainings, today)
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
  const nextMetrics = ownerMetrics.data

  const isLoading = weekQuery.isLoading || dogsQuery.isLoading || upcomingQuery.isLoading
  const error = weekQuery.error ?? dogsQuery.error ?? upcomingQuery.error

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-gutter pt-4 pb-6 md:px-gutter-desktop md:py-8">
      <header className="flex items-center gap-3">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-label font-semibold text-muted-foreground">
            {formatDayHeading(today)}
          </p>
          <h1 className="text-page font-extrabold tracking-tight xl:text-title">
            {userName ? `Ahoj ${firstName(userName)}` : "Dnes"}
            <span aria-hidden> 👋</span>
          </h1>
        </div>
        <ClickerToolDialog />
        <LogFreeTrainingDialog dogs={dogs} />
      </header>
      <UnreadReplyList zpet="dnes" />

      <QueryState
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          void weekQuery.refetch()
          void upcomingQuery.refetch()
          void dogsQuery.refetch()
        }}
        isEmpty={!heroTraining && weekTrainings.length === 0 && dogs.length === 0}
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
        <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start xl:gap-5">
          {heroTraining ? (
            <NextTrainingHero
              training={heroTraining}
              today={today}
            />
          ) : (
            <EmptyState
              icon={Calendar}
              chip="HOTOVO"
              title="Dnes máte volno"
              description={
                upcomingTrainings.some((item) => item.status === "PLANNED" && item.date > today)
                  ? "Dnes nemáte trénink. Další je na kartě psa nebo v týdnu."
                  : "Nemáte další naplánovaný trénink. Podívejte se na týden nebo na psy."
              }
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

          <QueryState
            className="xl:col-start-2 xl:row-start-1"
            isLoading={ownerMetrics.isLoading}
            error={ownerMetrics.error}
            onRetry={() => void ownerMetrics.refetch()}
            empty={null}
          >
            {nextMetrics && (
              <section
                aria-label="Metriky"
                className="grid grid-cols-3 gap-3 xl:grid-cols-1 xl:[&>article]:flex-row xl:[&>article]:items-center xl:[&>article]:p-4"
              >
                <article className="flex flex-col items-start gap-3 rounded-card border border-border bg-card p-3">
                  <ProgressRing
                    value={nextMetrics.weeklyCompletedSessions ?? 0}
                    target={nextMetrics.weeklyPlannedSessions ?? 0}
                    label="Týdenní plán"
                  />
                  <div>
                    <h2 className="text-xs font-medium text-muted-foreground">Týdenní plán</h2>
                    <p className="mt-1 text-sm font-bold">
                      {nextMetrics.weeklyPlannedSessions == null
                        ? "Načítám plán…"
                        : nextMetrics.weeklyPlannedSessions === 0
                          ? "Zatím bez plánu"
                          : `hotové ${nextMetrics.weeklyCompletedSessions} z ${nextMetrics.weeklyPlannedSessions}`}
                    </p>
                  </div>
                </article>
                <article className="flex flex-col items-start gap-3 rounded-card border border-border bg-card p-3">
                  <span className="flex size-12 items-center justify-center rounded-field bg-accent">
                    <DesignIcon name="today-Flame" />
                  </span>
                  <div>
                    <h2 className="text-xs font-medium text-muted-foreground">Série</h2>
                    <p className="mt-1 text-sm font-bold">
                      {nextMetrics.streak > 0 && <span aria-hidden>🔥 </span>}
                      {dayLabel(nextMetrics.streak)}
                    </p>
                  </div>
                </article>
                <article className="flex flex-col justify-between gap-3 rounded-card border border-border bg-card p-3">
                  <p className="flex h-12 items-center text-xl font-extrabold tabular-nums">
                    {nextMetrics.successRate == null
                      ? "—"
                      : `${Math.round(nextMetrics.successRate)} %`}
                  </p>
                  <div>
                    <h2 className="text-xs font-medium text-muted-foreground">Úspěšnost</h2>
                    <p
                      className={cn(
                        "mt-1 text-sm font-bold",
                        nextMetrics.weeklyChange != null && nextMetrics.weeklyChange < 0
                          ? "text-danger-foreground"
                          : "text-success-foreground",
                      )}
                    >
                      {nextMetrics.weeklyChange == null
                        ? "Bez srovnání"
                        : `${nextMetrics.weeklyChange > 0 ? "↗ +" : nextMetrics.weeklyChange < 0 ? "↘ " : ""}${nextMetrics.weeklyChange} b.`}
                    </p>
                  </div>
                </article>
              </section>
            )}
          </QueryState>

          <TodayWeekPreview
            key={weekStart}
            weekStart={weekStart}
            today={today}
          />
          {dogs.length > 0 ? (
            <section
              aria-labelledby="today-dogs-heading"
              className="flex flex-col gap-3 xl:col-start-2 xl:row-start-2"
            >
              <div className="flex items-center justify-between gap-3">
                <h2
                  id="today-dogs-heading"
                  className="text-section font-extrabold tracking-tight text-foreground"
                >
                  Tvoji psi
                </h2>
                <Link
                  to="/dogs"
                  className="inline-flex min-h-touch items-center text-sm font-bold text-primary"
                >
                  Všichni psi
                </Link>
              </div>
              <ul className="grid grid-cols-2 gap-3">
                {dogs.map((dog) => {
                  const nextForDog = pickNextTraining(
                    upcomingTrainings.filter((training) => training.dog.id === dog.id),
                    today,
                  )
                  const nextLabel = !nextForDog
                    ? null
                    : nextForDog.date === today
                      ? "Trénink dnes"
                      : nextForDog.date < today
                        ? `Zmeškaný ${formatDayLong(nextForDog.date)}`
                        : `Další trénink ${formatDayLong(nextForDog.date)}`
                  return (
                    <li key={dog.id}>
                      <DogPlayerCard
                        variant="compact"
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
          <div className="xl:col-start-2 xl:row-start-3">{updates.message}</div>
        </div>
      </QueryState>
    </div>
  )
}
