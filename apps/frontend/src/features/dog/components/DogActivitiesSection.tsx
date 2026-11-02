import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { unreadRepliesQueryOptions } from "@/lib/trainingReplies"

import type { DogActivity } from "@/features/dog/api/dogSchemas"
import { dogActivitiesQueryOptions } from "@/features/dog/api/dogsQueryOptions"
import { TrainingRecordDialog } from "@/features/dog/components/TrainingRecordDialog"

const DEFAULT_ACTIVITIES: DogActivity[] = [
  {
    id: "act-1",
    date: "18. října 2026",
    title: "Poslušnost v parku",
    status: "completed",
    successRate: 95,
    rating: 5,
    note: "Soustředil se skvěle, jen u druhého cviku byl trochu rozptýlený kolemjdoucím psem. Odložení za pohybu zvládl napoprvé.",
  },
  {
    id: "act-2",
    date: "16. října 2026",
    title: "Canicross intervaly",
    status: "completed",
    successRate: 88,
    rating: 4,
    note: "Pěkné tempo v první polovině trasy, pak mírná únava na štěrku. Celkově velmi dobré nasazení.",
  },
  {
    id: "act-3",
    date: "15. října 2026",
    title: "Trénink odložení",
    status: "skipped",
    note: "Pršelo a pes byl unavený po návštěvě veterináře. Trénink jsme po dohodě přeskočili.",
  },
  {
    id: "act-4",
    date: "13. října 2026",
    title: "Nosework – vyhledávání skořice",
    status: "completed",
    successRate: 100,
    rating: 5,
    note: "Všechny 3 vzorky našel do 40 sekund. Perfektní označení čumákem bez škrábání.",
  },
  {
    id: "act-5",
    date: "11. října 2026",
    title: "Socializace na nádraží",
    status: "completed",
    successRate: 80,
    rating: 4,
    note: "Hluk přijíždějícího vlaku zvládl s pamlsky, u eskalátoru ještě váhal.",
  },
  {
    id: "act-6",
    date: "9. října 2026",
    title: "Klid v kavárně",
    status: "skipped",
    note: "Přesunuto z důvodu nemoci psovoda.",
  },
]

const ITEMS_PER_PAGE = 3

type DogActivitiesSectionProps = {
  dogId?: string
  dogName: string
  activities?: DogActivity[]
  openActivityId?: string
  onActivityClose?: () => void
}

function formatActivityDate(date?: Date | string, fallback?: string): string {
  if (fallback) return fallback
  if (!date) return "Nedávno"
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return "Nedávno"
  return d.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function DogActivitiesSection({
  dogId,
  dogName,
  activities: initialActivities,
  openActivityId,
  onActivityClose,
}: DogActivitiesSectionProps) {
  const [page, setPage] = useState(1)
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    openActivityId ?? null,
  )

  const replies = useQuery({
    ...unreadRepliesQueryOptions(),
    enabled: Boolean(dogId) && !initialActivities,
  })
  const activitiesQuery = useQuery({
    ...dogActivitiesQueryOptions(dogId ?? ""),
    enabled: Boolean(dogId) && initialActivities === undefined,
  })

  const effectiveActivities =
    initialActivities ?? activitiesQuery.data ?? (dogId ? [] : DEFAULT_ACTIVITIES)
  // Resolve from current query data so a refreshed author cannot remain in an
  // already open dialog after the trainer deletes their account.
  const selectedActivity = effectiveActivities.find(
    (activity) => activity.id === selectedActivityId,
  )

  const totalPages = Math.ceil(effectiveActivities.length / ITEMS_PER_PAGE) || 1
  const startIndex = (page - 1) * ITEMS_PER_PAGE
  const currentItems = effectiveActivities.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return (
    <section
      className="space-y-4"
      aria-labelledby="activities-heading"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2
            id="activities-heading"
            className="text-lg font-semibold tracking-tight text-foreground"
          >
            Aktivity
          </h2>
          <p className="text-xs text-muted-foreground">Záznamy tréninků od nejnovějšího</p>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={!hasPrevPage}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Předchozí stránka aktivit"
              className="size-9"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-xs text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={!hasNextPage}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Další stránka aktivit"
              className="size-9"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {replies.isError && (
        <p
          role="alert"
          className="text-sm text-muted-foreground"
        >
          Nové odpovědi se nepodařilo načíst.{" "}
          <Button
            variant="ghost"
            className="min-h-12"
            onClick={() => void replies.refetch()}
          >
            Zkusit znovu
          </Button>
        </p>
      )}
      {activitiesQuery.isError && !initialActivities ? (
        <div
          className="space-y-3"
          role="alert"
        >
          <p className="text-sm text-destructive">
            Tréninkové záznamy a zprávy se nepodařilo načíst.
          </p>
          <Button
            variant="outline"
            className="min-h-12"
            onClick={() => void activitiesQuery.refetch()}
          >
            Zkusit znovu
          </Button>
        </div>
      ) : activitiesQuery.isLoading && !initialActivities ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : effectiveActivities.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {dogName} zatím nemá zaznamenané žádné tréninky.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {currentItems.map((item) => {
            const isCompleted = item.status === "completed"

            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setSelectedActivityId(item.id)}
                className="group min-h-12 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Otevřít detail aktivity ${item.title}`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="size-3.5" />
                      {formatActivityDate(item.completedAt, item.date)}
                    </span>
                    <span className="mt-1 font-semibold text-foreground transition-colors group-hover:text-primary">
                      {item.title}
                    </span>
                    {replies.data?.some((reply) => reply.workoutLog?.id === item.id) && (
                      <Badge
                        variant="secondary"
                        className="mt-2"
                      >
                        nová odpověď
                      </Badge>
                    )}
                  </span>

                  <Badge variant={isCompleted ? "secondary" : "outline"}>
                    {isCompleted ? "Odcvičeno" : "Přeskočeno"}
                  </Badge>
                </span>

                {isCompleted && (
                  <span className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {item.successRate !== undefined && (
                      <span className="font-semibold text-foreground">
                        Úspěšnost: {item.successRate} %
                      </span>
                    )}
                    {item.rating !== undefined && <span>Hodnocení: {item.rating}/5</span>}
                  </span>
                )}

                {item.note && (
                  <span className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {item.note}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {selectedActivityId && (
        <TrainingRecordDialog
          key={selectedActivityId}
          dogId={dogId ?? ""}
          dogName={dogName}
          activityId={selectedActivityId}
          initialActivity={initialActivities || !dogId ? selectedActivity : undefined}
          onClose={() => {
            setSelectedActivityId(null)
            onActivityClose?.()
          }}
        />
      )}
    </section>
  )
}
