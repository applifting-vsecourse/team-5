import { Link } from "@tanstack/react-router"
import { ChevronRight } from "lucide-react"

import { dogColorClass } from "@/lib/dogColors"
import type { DogMetrics } from "@/lib/dogMetrics"
import { cn } from "@/lib/utils"

type DogPlayer = {
  id: string
  name: string
  color: number
  breed?: string | null
  disciplines?: string[]
}

const BAR_HEIGHT = ["h-1", "h-2", "h-3", "h-4", "h-6", "h-8", "h-10"] as const

function barHeight(rate: number | null): string {
  if (rate == null) return "h-1"
  const index = Math.min(BAR_HEIGHT.length - 1, Math.round((rate / 100) * (BAR_HEIGHT.length - 1)))
  return BAR_HEIGHT[index] ?? "h-1"
}

function dayLabel(days: number): string {
  if (days === 1) return "1 den"
  if (days >= 2 && days <= 4) return `${days} dny`
  return `${days} dní`
}

function detailLine(dog: Pick<DogPlayer, "breed" | "disciplines">): string | null {
  const parts = [dog.breed, ...(dog.disciplines ?? [])].filter((part): part is string =>
    Boolean(part?.trim()),
  )
  return parts.length > 0 ? parts.join(" · ") : null
}

export type DogPlayerCardProps = {
  dog: DogPlayer
  metrics?: DogMetrics | null
  activeGoalCount?: number | null
  goalCount?: number | null
  nextLabel?: string | null
}

/** Filled dog-colour card from Figma „Moji psi“ (frame 118:1019). */
export function DogPlayerCard({
  dog,
  metrics,
  activeGoalCount,
  goalCount,
  nextLabel,
}: DogPlayerCardProps) {
  const weeks = (metrics?.weeks ?? []).slice(-8)
  const hasGoalCounts = activeGoalCount != null && goalCount != null
  const subtitle = detailLine(dog)
  const initial = dog.name.trim().charAt(0).toUpperCase() || "P"

  return (
    <article className={cn("rounded-card p-4 text-dog-foreground", dogColorClass(dog.color))}>
      <Link
        to="/dogs/$dogId"
        params={{ dogId: dog.id }}
        className="flex items-start justify-between gap-3 rounded-control outline-hidden focus-visible:ring-2 focus-visible:ring-dog-foreground focus-visible:ring-offset-2"
        aria-label={`Detail psa ${dog.name}`}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-base font-extrabold text-foreground"
          >
            {initial}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-title font-extrabold tracking-tight">
              {dog.name}
            </span>
            {subtitle ? (
              <span className="block truncate text-sm font-medium">{subtitle}</span>
            ) : null}
          </span>
        </span>
        <ChevronRight
          className="mt-1 size-5 shrink-0"
          aria-hidden
        />
      </Link>

      {metrics || hasGoalCounts ? (
        <dl className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-dog-foreground/15 px-2 py-2">
            <dt className="text-label">Úspěšnost</dt>
            <dd className="text-base font-extrabold tabular-nums">
              {metrics?.successRate != null ? `${Math.round(metrics.successRate)} %` : "—"}
            </dd>
          </div>
          <div className="rounded-lg bg-dog-foreground/15 px-2 py-2">
            <dt className="text-label">Série</dt>
            <dd className="text-base font-extrabold tabular-nums">
              {metrics ? dayLabel(metrics.streak) : "—"}
            </dd>
          </div>
          <div className="rounded-lg bg-dog-foreground/15 px-2 py-2">
            <dt className="text-label">Cíle</dt>
            <dd className="text-base font-extrabold tabular-nums">
              {hasGoalCounts ? `${activeGoalCount}/${goalCount}` : "—"}
            </dd>
          </div>
        </dl>
      ) : null}

      {weeks.length > 0 ? (
        <div className="mt-4">
          <p className="text-label">Úspěšnost za 8 týdnů</p>
          <div
            className="mt-2 flex h-10 items-end gap-1"
            role="img"
            aria-label="Úspěšnost za posledních osm týdnů"
          >
            {weeks.map((week) => (
              <span
                key={week.from}
                className={cn(
                  "w-2 rounded-full bg-dog-foreground",
                  barHeight(week.successRate),
                  week.successRate == null && "opacity-40",
                )}
              />
            ))}
          </div>
        </div>
      ) : null}

      {nextLabel ? (
        <p className="mt-4 text-sm font-semibold">
          <span className="text-label font-bold tracking-wide uppercase">Další trénink </span>
          {nextLabel}
        </p>
      ) : null}
    </article>
  )
}
