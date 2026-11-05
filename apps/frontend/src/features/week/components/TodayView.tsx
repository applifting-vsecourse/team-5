import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Calendar, PawPrint, Play } from "lucide-react"

import { EmptyState } from "@/components/EmptyState"
import { HeroCard, HeroChip } from "@/components/HeroCard"
import { Metric } from "@/components/Metric"
import { QueryState } from "@/components/QueryState"
import { StripCard } from "@/components/StripCard"
import { Button } from "@/components/ui/button"
import {
  formatDayLong,
  startOfWeekOf,
  todayCalendarDate,
  type CalendarDate,
} from "@/lib/calendarDate"
import { dogColorClass } from "@/lib/dogColors"
import { cn } from "@/lib/utils"

import { weekTrainingsQueryOptions, type WeekTraining } from "@/features/week/api/weekQueryOptions"
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
}

function NextTrainingHero({ training, today }: NextTrainingHeroProps) {
  const isToday = training.date === today
  const titles = training.exercises.map((exercise) => exercise.title)

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
          <span className="text-xs font-semibold text-hero-muted">{formatDayLong(training.date)}</span>
        ) : null}
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-extrabold tracking-tight text-hero-foreground">
          {training.goal.title}
        </h2>
        <p className="text-sm font-medium text-hero-muted">
          {titles.length === 0
            ? "Plán zatím nemá žádný cvik."
            : `${exerciseCount(titles.length)} · ${titles.join(", ")}`}
        </p>
      </div>

      {training.exercises.length > 0 ? (
        <ol className="list-decimal space-y-1 pl-5 text-sm font-medium text-hero-muted">
          {training.exercises.slice(0, 5).map((exercise) => (
            <li key={exercise.id}>{exercise.title}</li>
          ))}
        </ol>
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
  const weekQuery = useQuery(weekTrainingsQueryOptions(weekStart))

  const trainings = weekQuery.data ?? []
  const nextTraining = pickNextTraining(trainings, today)
  const completedCount = trainings.filter((training) => training.status === "COMPLETED").length
  const totalCount = trainings.length
  const remainingPlanned = trainings.filter(
    (training) => training.status === "PLANNED" && training.date >= today,
  ).length

  const dogs = [...new Map(trainings.map((training) => [training.dog.id, training.dog])).values()]

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 md:py-8">
      <header className="space-y-1">
        <p className="text-sm font-semibold text-muted-foreground">{formatDayHeading(today)}</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          {userName ? `Ahoj ${firstName(userName)}` : "Dnes"}
        </h1>
      </header>

      <QueryState
        isLoading={weekQuery.isLoading}
        error={weekQuery.error}
        onRetry={() => void weekQuery.refetch()}
        isEmpty={!nextTraining && trainings.length === 0}
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
              description="V tomto týdnu už nemáte další naplánovaný trénink. Podívejte se na týden nebo na psy."
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
              className="rounded-card border border-border bg-card p-4"
            >
              <h2
                id="today-week-progress"
                className="text-sm font-bold text-foreground"
              >
                Týdenní postup
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <Metric
                  value={`${completedCount}/${totalCount}`}
                  label="odcvičeno tento týden"
                />
                <Metric
                  value={remainingPlanned}
                  label={remainingPlanned === 1 ? "zbývá trénink" : "zbývá tréninků"}
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
                className="text-lg font-bold tracking-tight text-foreground"
              >
                Tvoji psi
              </h2>
              <ul className="flex flex-col gap-2">
                {dogs.map((dog) => {
                  const nextForDog = pickNextTraining(
                    trainings.filter((training) => training.dog.id === dog.id),
                    today,
                  )
                  const subtitle = nextForDog
                    ? nextForDog.date === today
                      ? `Dnes · ${nextForDog.goal.title}`
                      : `${formatDayLong(nextForDog.date)} · ${nextForDog.goal.title}`
                    : "Bez dalšího plánu tento týden"
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
