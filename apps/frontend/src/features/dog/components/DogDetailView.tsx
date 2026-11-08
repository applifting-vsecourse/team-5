import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { getISOWeek, parseISO } from "date-fns"

import { ConfirmDestructiveDialog } from "@/components/ConfirmDestructiveDialog"
import { DesignIcon } from "@/components/DesignIcon"
import { dogTextClass } from "@/components/DogPlayerCard"
import { PesAvatar } from "@/components/PesAvatar"
import { QueryState } from "@/components/QueryState"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { dogColorClass } from "@/lib/dogColors"
import type { DogMetrics } from "@/lib/dogMetrics"
import { cn } from "@/lib/utils"

import type { Dog } from "@/features/dog/api/dogSchemas"
import { dogMetricsQueryOptions, dogNotesQueryOptions } from "@/features/dog/api/dogsQueryOptions"
import { dogPlanQueryOptions } from "@/features/dog/api/trainingEditor"
import { EditDogDialog } from "@/features/dog/components/EditDogDialog"
import { useArchiveDog, useRestoreDog } from "@/features/dog/hooks/useUpdateDog"

function profileFacts(dog: Dog) {
  let age: string | undefined
  if (dog.birthDate) {
    const birth = parseISO(dog.birthDate),
      now = new Date()
    const years =
      now.getFullYear() -
      birth.getFullYear() -
      (now.getMonth() < birth.getMonth() ||
      (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
        ? 1
        : 0)
    age = years < 1 ? "do 1 roku" : `${years} ${years === 1 ? "rok" : years <= 4 ? "roky" : "let"}`
  }
  return [
    dog.breed,
    age,
    dog.weightKg != null ? `${dog.weightKg.toLocaleString("cs-CZ")} kg` : null,
  ]
    .filter(Boolean)
    .join(" · ")
}

function WeeklySuccessChart({ metrics, dog }: { metrics: DogMetrics; dog: Dog }) {
  return (
    <section
      className="space-y-4 rounded-card border border-border bg-card p-4"
      aria-labelledby="dog-success-heading"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2
            id="dog-success-heading"
            className="text-sm font-extrabold"
          >
            Úspěšnost po týdnech
          </h2>
          <p className="text-xs text-muted-foreground">Posledních 8 týdnů</p>
        </div>
        {metrics.weeklyChange != null && (
          <span
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold",
              metrics.weeklyChange < 0
                ? "bg-danger-surface text-danger-foreground"
                : "bg-success text-success-foreground",
            )}
          >
            {metrics.weeklyChange > 0 ? "↗ +" : metrics.weeklyChange < 0 ? "↘ " : ""}
            {metrics.weeklyChange} b.
          </span>
        )}
      </div>
      <div
        className="flex h-40 items-end gap-2"
        role="img"
        aria-label="Úspěšnost za posledních osm týdnů"
      >
        {metrics.weeks.map((week, index) => (
          <div
            key={week.from}
            className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
            title={`${week.from} až ${week.to}: ${week.successRate == null ? "bez hodnoceného tréninku" : `${week.successRate} %`}`}
          >
            <span className="text-xs font-bold text-muted-foreground">
              {week.successRate == null ? "—" : Math.round(week.successRate)}
            </span>
            <span className="flex h-24 w-full items-end">
              <span
                className={cn(
                  "block min-h-1 w-full rounded-t-field",
                  week.successRate == null ? "bg-secondary" : dogColorClass(dog.color),
                  index < metrics.weeks.length - 1 && "opacity-35",
                )}
                style={{ height: `${week.successRate ?? 0}%` }}
              />
            </span>
            <span className="text-xs text-muted-foreground">
              {getISOWeek(parseISO(week.from))}.
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

export function DogDetailView({ dog, isOwner = true }: { dog: Dog; isOwner?: boolean }) {
  const [isEditOpen, setEditOpen] = useState(false)
  const [shouldShowAllSkills, setShowAllSkills] = useState(false)
  const archive = useArchiveDog(dog.id)
  const restore = useRestoreDog(dog.id)
  const metrics = useQuery(dogMetricsQueryOptions(dog.id))
  const plan = useQuery(dogPlanQueryOptions(dog.id))
  const notes = useQuery({ ...dogNotesQueryOptions(dog.id), enabled: isOwner })
  const groups = (plan.data ?? []).filter((group) => !group.isArchived)
  const goals = groups.flatMap((group) =>
    group.goals
      .filter((goal) => goal.status !== "ARCHIVED")
      .map((goal) => ({ ...goal, discipline: group.discipline.name })),
  )
  const skills = [
    ...new Set(
      goals.flatMap((goal) =>
        goal.sessions
          .filter((session) => !session.isArchived)
          .flatMap((session) =>
            session.steps.filter((step) => step.outcome === "MASTERED").map((step) => step.title),
          ),
      ),
    ),
  ]
  const facts = profileFacts(dog)
  return (
    <div className="mx-auto w-full max-w-2xl md:py-8">
      <header
        className={cn(
          "space-y-5 rounded-b-sheet px-gutter pt-3 pb-6 text-dog-foreground md:rounded-sheet",
          dogColorClass(dog.color),
        )}
      >
        <nav
          aria-label="Navigace zpět"
          className="flex items-center justify-between gap-3"
        >
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="rounded-field bg-dog-foreground/15 text-dog-foreground hover:bg-dog-foreground/25 hover:text-dog-foreground"
          >
            {isOwner ? (
              <Link
                to="/dogs"
                aria-label="Zpět na seznam psů"
              >
                <DesignIcon name="profile-ChevL" />
              </Link>
            ) : (
              <Link
                to="/clients/$clientId"
                params={{ clientId: dog.ownerId }}
                aria-label="Zpět na detail klienta"
              >
                <DesignIcon name="profile-ChevL" />
                <span className="sr-only">Klient</span>
              </Link>
            )}
          </Button>
          <p className="text-sm font-bold">Profil psa</p>
          {isOwner && !dog.isArchived ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Upravit psa"
              className="rounded-field bg-dog-foreground/15 text-dog-foreground hover:bg-dog-foreground/25 hover:text-dog-foreground"
              onClick={() => setEditOpen(true)}
            >
              <DesignIcon name="profile-Edit" />
            </Button>
          ) : (
            <span className="size-11" />
          )}
        </nav>
        {dog.isArchived && (
          <p className="rounded-control bg-dog-foreground/15 px-3 py-2 text-sm font-semibold">
            Pes je v archivu. Historie zůstává, v Psech a Týdnu se neukazuje.
          </p>
        )}
        <div className="flex items-center gap-4">
          <PesAvatar
            name={dog.name}
            color={dog.color}
            photoUrl={dog.photoUrl}
            className={cn(
              "size-18 bg-card text-3xl font-extrabold ring-0 ring-offset-0",
              dogTextClass(dog.color),
            )}
          />
          <div className="min-w-0 flex-1 space-y-1.5">
            <h1 className="text-title font-extrabold tracking-tight break-words">{dog.name}</h1>
            {facts && <p className="text-sm">{facts}</p>}
            {dog.disciplines.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {dog.disciplines.map((discipline) => (
                  <li key={discipline}>
                    <Link
                      to="/dogs/$dogId/goals"
                      params={{ dogId: dog.id }}
                      search={{ disciplina: discipline }}
                      className="inline-flex min-h-touch items-center rounded-full bg-dog-foreground/15 px-3 text-xs font-semibold"
                    >
                      {discipline}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {metrics.isLoading ? (
          <Skeleton
            className="h-16 w-full bg-dog-foreground/15"
            aria-label="Načítání metrik"
          />
        ) : metrics.isError ? (
          <div
            role="alert"
            className="space-y-2 text-sm"
          >
            <p>Metriky se nepodařilo načíst.</p>
            <Button
              variant="ghost"
              className="text-dog-foreground"
              onClick={() => void metrics.refetch()}
            >
              Zkusit znovu
            </Button>
          </div>
        ) : (
          metrics.data && (
            <dl className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-0.5 rounded-control bg-dog-foreground/15 px-3 py-2.5">
                <dd className="order-first text-xl font-extrabold">
                  {metrics.data.successRate == null
                    ? "—"
                    : `${Math.round(metrics.data.successRate)} %`}
                </dd>
                <dt className="text-xs">Úspěšnost</dt>
              </div>
              <div className="flex flex-col gap-0.5 rounded-control bg-dog-foreground/15 px-3 py-2.5">
                <dd className="order-first text-xl font-extrabold">
                  <Link
                    to="/dogs/$dogId/activities"
                    params={{ dogId: dog.id }}
                    aria-label="Historie tréninků"
                  >
                    {metrics.data.completedSessions ?? "—"}
                  </Link>
                </dd>
                <dt className="text-xs">Tréninků</dt>
              </div>
              <div className="flex flex-col gap-0.5 rounded-control bg-dog-foreground/15 px-3 py-2.5">
                <dd className="order-first text-xl font-extrabold">
                  {metrics.data.streak > 0 ? "🔥 " : ""}
                  {metrics.data.streak}
                </dd>
                <dt className="text-xs">Série dní</dt>
              </div>
            </dl>
          )
        )}
      </header>
      {isOwner && !dog.isArchived && (
        <EditDogDialog
          dog={dog}
          isOpen={isEditOpen}
          onOpenChange={setEditOpen}
        />
      )}
      <div className="space-y-6 px-gutter pt-5 pb-6">
        {metrics.data && (
          <WeeklySuccessChart
            metrics={metrics.data}
            dog={dog}
          />
        )}
        <section
          className="space-y-3 rounded-card border border-border bg-card p-4"
          aria-labelledby="dog-profile-goals"
        >
          <div className="flex items-center justify-between gap-3">
            <h2
              id="dog-profile-goals"
              className="text-section font-extrabold"
            >
              Cíle
            </h2>
            <Link
              to="/dogs/$dogId/goals"
              params={{ dogId: dog.id }}
              search={{}}
              className="inline-flex min-h-touch items-center text-sm font-bold text-primary"
            >
              Všechny
            </Link>
          </div>
          <QueryState
            isLoading={plan.isLoading}
            error={plan.error}
            onRetry={() => void plan.refetch()}
            empty={null}
          >
            {goals.slice(0, 3).map((goal) => {
              const sessions = goal.sessions.filter((session) => !session.isArchived)
              const completed = sessions.filter((session) =>
                session.scheduledTrainings?.some((training) => training.status === "COMPLETED"),
              ).length
              const isCompleted = goal.status === "COMPLETED"
              const percent = isCompleted
                ? 100
                : sessions.length
                  ? Math.round((completed / sessions.length) * 100)
                  : 0
              return (
                <Link
                  key={goal.id}
                  to="/dogs/$dogId/goals/$goalId"
                  params={{ dogId: dog.id, goalId: goal.id }}
                  className="block space-y-2 border-b border-border pb-3 last:border-b-0 last:pb-0"
                >
                  <span className="flex min-h-touch items-center gap-2.5">
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-field",
                        isCompleted ? "bg-success" : "bg-accent",
                      )}
                    >
                      <DesignIcon name={isCompleted ? "profile-Check" : "profile-Target"} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold break-words">{goal.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {goal.discipline} ·{" "}
                        {isCompleted ? "splněno" : `${completed} z ${sessions.length} tréninků`}
                        {goal.deadline
                          ? ` · do ${parseISO(goal.deadline).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" })}`
                          : ""}
                      </span>
                    </span>
                    <span className="text-sm font-extrabold">{percent} %</span>
                  </span>
                  <Progress
                    value={percent}
                    aria-label={`${goal.title}: ${percent} %`}
                    className={cn(
                      "h-1.5",
                      isCompleted && "[&_[data-slot=progress-indicator]]:bg-success-foreground",
                    )}
                  />
                </Link>
              )
            })}
            {!goals.length && (
              <p className="text-sm text-muted-foreground">
                Zatím žádné cíle. První vytvoříš v přehledu všech cílů.
              </p>
            )}
          </QueryState>
        </section>
        <section
          className="space-y-3 rounded-card border border-border bg-card p-4"
          aria-labelledby="dog-skills-heading"
        >
          <div className="flex items-center justify-between gap-3">
            <h2
              id="dog-skills-heading"
              className="text-section font-extrabold"
            >
              Zvládnuté dovednosti
            </h2>
            {plan.isSuccess && (
              <span className="text-sm font-bold text-primary">{skills.length}</span>
            )}
          </div>
          <QueryState
            isLoading={plan.isLoading}
            error={plan.error}
            onRetry={() => void plan.refetch()}
            empty={null}
          >
            <ul className="flex flex-wrap gap-2">
              {skills.slice(0, shouldShowAllSkills ? undefined : 6).map((skill) => (
                <li
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-full bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground"
                >
                  <DesignIcon name="profile-Check1" />
                  {skill}
                </li>
              ))}
            </ul>
            {!skills.length && (
              <p className="text-sm text-muted-foreground">
                Zatím nejsou označené žádné zvládnuté kroky.
              </p>
            )}
            {skills.length > 6 && (
              <Button
                variant="link"
                className="px-0 text-xs text-muted-foreground"
                onClick={() => setShowAllSkills(!shouldShowAllSkills)}
              >
                {shouldShowAllSkills ? "Zobrazit méně" : `+ ${skills.length - 6} dalších`}
              </Button>
            )}
          </QueryState>
        </section>
        <Link
          to="/dogs/$dogId/activities"
          params={{ dogId: dog.id }}
          className="flex min-h-touch items-center gap-3 rounded-card border border-border bg-card p-4"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-field bg-accent">
            <DesignIcon name="profile-Calendar" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">Historie tréninků</span>
            <span className="block text-xs text-muted-foreground">
              {metrics.data?.completedSessions != null
                ? `${metrics.data.completedSessions} ${
                    metrics.data.completedSessions === 1
                      ? "trénink"
                      : metrics.data.completedSessions >= 2 && metrics.data.completedSessions <= 4
                        ? "tréninky"
                        : "tréninků"
                  }`
                : "Záznamy a zprávy"}
            </span>
          </span>
          <DesignIcon name="profile-ChevR" />
        </Link>
        {isOwner && (
          <Link
            to="/dogs/$dogId/notes"
            params={{ dogId: dog.id }}
            className="flex min-h-touch items-center gap-3 rounded-card border border-border bg-card p-4"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-field bg-accent">
              <DesignIcon name="profile-Book" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">Poznámky</span>
              <span className="block text-xs text-muted-foreground">
                Deník psa · vidí jen psovod
                {notes.isSuccess ? ` · ${notes.data.length} poznámek` : ""}
              </span>
            </span>
            <DesignIcon name="profile-ChevR" />
          </Link>
        )}
        {isOwner && !dog.isArchived && (
          <ConfirmDestructiveDialog
            title="Archivovat psa?"
            description={`${dog.name} zmizí ze seznamu Psů i z Týdne. Historie cílů, tréninků a záznamů zůstane a psa půjde kdykoli vrátit.`}
            confirmLabel="Archivovat"
            onConfirm={() => archive.mutate()}
            trigger={
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={archive.isPending}
              >
                Archivovat psa
              </Button>
            }
          />
        )}
        {isOwner && dog.isArchived && (
          <Button
            type="button"
            className="w-full"
            disabled={restore.isPending}
            onClick={() => restore.mutate()}
          >
            Vrátit z archivu
          </Button>
        )}
      </div>
    </div>
  )
}
