import { Link } from "@tanstack/react-router"

import { DesignIcon } from "@/components/DesignIcon"
import { DogTrend } from "@/components/DogTrend"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { dogColorClass } from "@/lib/dogColors"
import type { DogMetrics } from "@/lib/dogMetrics"
import { cn } from "@/lib/utils"

type DogPlayer = {
  id: string
  name: string
  color: number
  breed?: string | null
  disciplines?: string[]
  birthDate?: string | null
  photoUrl?: string | null
}
export type DogPlayerCardProps = {
  dog: DogPlayer
  metrics?: DogMetrics | null
  completedGoalCount?: number | null
  goalCount?: number | null
  nextLabel?: string | null
  variant?: "full" | "compact"
}

const dogTextClasses = [
  "text-dog-1",
  "text-dog-2",
  "text-dog-3",
  "text-dog-4",
  "text-dog-5",
  "text-dog-6",
]
export function dogTextClass(color: number) {
  return dogTextClasses[color - 1] ?? dogTextClasses[0]
}
export function dayLabel(days: number) {
  return `${days} ${days === 1 ? "den" : days >= 2 && days <= 4 ? "dny" : "dní"}`
}

function subtitle(dog: DogPlayer) {
  let age: string | undefined
  if (dog.birthDate) {
    const birth = new Date(`${dog.birthDate}T12:00:00`)
    const now = new Date()
    const years =
      now.getFullYear() -
      birth.getFullYear() -
      (now.getMonth() < birth.getMonth() ||
      (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
        ? 1
        : 0)
    age = years < 1 ? "do 1 roku" : `${years} ${years === 1 ? "rok" : years <= 4 ? "roky" : "let"}`
  }
  return [dog.breed, age, ...(dog.disciplines ?? [])].filter(Boolean).join(" · ")
}

export function DogPlayerCard({
  dog,
  metrics,
  completedGoalCount,
  goalCount,
  nextLabel,
  variant = "full",
}: DogPlayerCardProps) {
  const isCompact = variant === "compact"
  const rate = metrics?.successRate == null ? "—" : `${Math.round(metrics.successRate)} %`
  const initial = dog.name.trim().charAt(0).toUpperCase() || "P"
  const detail = subtitle(dog)
  const nextText = nextLabel === undefined ? "Načítám termín…" : (nextLabel ?? "Zatím bez termínu")
  const identity = (
    <Avatar
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-card font-extrabold",
        dogTextClass(dog.color),
        isCompact ? "size-8 text-sm" : "size-14 text-2xl",
      )}
    >
      <AvatarImage
        src={dog.photoUrl ?? undefined}
        alt=""
      />
      <AvatarFallback
        className={cn(
          "bg-card font-extrabold",
          dogTextClass(dog.color),
          isCompact ? "text-sm" : "text-2xl",
        )}
      >
        {initial}
      </AvatarFallback>
    </Avatar>
  )
  const trend = (
    <DogTrend
      weeks={metrics?.weeks ?? []}
      isCompact={isCompact}
    />
  )
  if (isCompact) {
    return (
      <Link
        to="/dogs/$dogId"
        params={{ dogId: dog.id }}
        aria-label={`Detail psa ${dog.name}`}
        className={cn(
          "flex min-w-0 flex-col gap-3 rounded-card p-4 text-dog-foreground",
          dogColorClass(dog.color),
        )}
      >
        <span className="flex items-center justify-between gap-2">
          {identity}
          <span className="text-sm font-extrabold tabular-nums">{rate}</span>
        </span>
        <span className="min-w-0">
          <span className="block text-section font-extrabold break-words">{dog.name}</span>
          <span className="mt-1 block text-xs font-medium">{nextText}</span>
        </span>
        <span className="mt-auto block pt-1">{trend}</span>
      </Link>
    )
  }
  return (
    <article
      className={cn("space-y-4 rounded-sheet p-5 text-dog-foreground", dogColorClass(dog.color))}
    >
      <Link
        to="/dogs/$dogId"
        params={{ dogId: dog.id }}
        aria-label={`Detail psa ${dog.name}`}
        className="flex min-h-touch items-center gap-3 rounded-field"
      >
        {identity}
        <span className="min-w-0 flex-1">
          <span className="block text-dog-name leading-tight font-extrabold break-words">
            {dog.name}
          </span>
          {detail && <span className="block text-xs font-medium break-words">{detail}</span>}
        </span>
        <DesignIcon name="dogs-ChevR" />
      </Link>
      <dl className="grid grid-cols-3 gap-2">
        <div className="flex flex-col rounded-field bg-dog-foreground/15 px-3 py-2">
          <dd className="order-first text-lg font-extrabold tabular-nums">{rate}</dd>
          <dt className="text-xs font-medium">Úspěšnost</dt>
        </div>
        <div className="flex flex-col rounded-field bg-dog-foreground/15 px-3 py-2">
          <dd className="order-first text-lg font-extrabold tabular-nums">
            {metrics ? (
              <>
                {metrics.streak > 0 && <span aria-hidden>🔥 </span>}
                {dayLabel(metrics.streak)}
              </>
            ) : (
              "—"
            )}
          </dd>
          <dt className="text-xs font-medium">Série</dt>
        </div>
        <div className="flex flex-col rounded-field bg-dog-foreground/15 px-3 py-2">
          <dd className="order-first text-lg font-extrabold tabular-nums">
            {completedGoalCount != null && goalCount != null
              ? `${completedGoalCount}/${goalCount}`
              : "—"}
          </dd>
          <dt className="text-xs font-medium">Cíle</dt>
        </div>
      </dl>
      <div className="flex items-end gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs font-semibold">Úspěšnost za 8 týdnů</p>
          {trend}
        </div>
        <p className="max-w-32 shrink-0 text-sm font-bold">
          <span className="block text-xs font-extrabold uppercase">Další trénink</span>
          {nextText}
        </p>
      </div>
    </article>
  )
}
