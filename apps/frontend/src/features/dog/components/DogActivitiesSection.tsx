import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Calendar, ChevronLeft, ChevronRight, FileText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"

import type { DogActivity } from "@/features/dog/api/dogSchemas"
import { dogActivitiesQueryOptions } from "@/features/dog/api/dogsQueryOptions"

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
  // On the dog's page: only the latest records and a link to the full
  // history, which has its own page.
  isCompact?: boolean
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
  isCompact = false,
}: DogActivitiesSectionProps) {
  const [page, setPage] = useState(1)
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)

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

  // The compact list is always the first page, without paging.
  const totalPages = isCompact ? 1 : Math.ceil(effectiveActivities.length / ITEMS_PER_PAGE) || 1
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
          <p className="text-xs text-muted-foreground">
            {isCompact ? "Poslední záznamy tréninků" : "Záznamy tréninků od nejnovějšího"}
          </p>
        </div>

        {isCompact && dogId && effectiveActivities.length > 0 && (
          <Link
            to="/dogs/$dogId/activities"
            params={{ dogId }}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Celá historie
            <ChevronRight className="size-4" />
          </Link>
        )}

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
              <Card
                key={item.id}
                onClick={() => setSelectedActivityId(item.id)}
                className="group cursor-pointer border border-border p-4 transition-colors hover:border-foreground/30"
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setSelectedActivityId(item.id)
                  }
                }}
                aria-label={`Otevřít detail aktivity ${item.title}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="size-3.5" />
                      {formatActivityDate(item.completedAt, item.date)}
                    </span>
                    <h3 className="mt-1 font-semibold text-foreground transition-colors group-hover:text-primary">
                      {item.title}
                    </h3>
                  </div>

                  <Badge variant={isCompleted ? "secondary" : "outline"}>
                    {isCompleted ? "Odcvičeno" : "Přeskočeno"}
                  </Badge>
                </div>

                {/* Only the header in the list; results, the note and the
                    messages are in the detail. */}
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog detailu aktivity */}
      <Dialog
        open={Boolean(selectedActivity)}
        onOpenChange={(isOpenState) => {
          if (!isOpenState) setSelectedActivityId(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          {selectedActivity && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-2 pr-6">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="size-3.5" />
                    {selectedActivity.date}
                  </span>
                  <Badge
                    variant={selectedActivity.status === "completed" ? "secondary" : "outline"}
                  >
                    {selectedActivity.status === "completed" ? "Odcvičeno" : "Přeskočeno"}
                  </Badge>
                </div>
                <DialogTitle className="mt-2 text-xl font-bold tracking-tight">
                  {selectedActivity.title}
                </DialogTitle>
                <DialogDescription>
                  Detail tréninkového záznamu pro psa {dogName}.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {selectedActivity.status === "completed" && (
                  <div className="flex items-center justify-between gap-4 rounded-lg bg-secondary/50 p-4">
                    {selectedActivity.successRate !== undefined && (
                      <div>
                        <div className="text-xs text-muted-foreground">Úspěšnost</div>
                        <div className="font-mono text-lg font-bold text-foreground">
                          {selectedActivity.successRate} %
                        </div>
                      </div>
                    )}
                    {selectedActivity.rating !== undefined && (
                      <div>
                        <div className="text-xs text-muted-foreground">Hodnocení</div>
                        <div className="font-mono text-lg font-bold text-foreground">
                          {selectedActivity.rating} / 5
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedActivity.note && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <FileText className="size-3.5" />
                      <span>Poznámka z tréninku</span>
                    </div>
                    <p className="rounded-md border border-border p-3 text-sm text-muted-foreground">
                      {selectedActivity.note}
                    </p>
                  </div>
                )}

                <section
                  className="space-y-3"
                  aria-label="Zprávy u tréninku"
                >
                  <h3 className="text-lg font-semibold tracking-tight">Zprávy u tréninku</h3>
                  {selectedActivity.messages?.length ? (
                    <ol className="space-y-4">
                      {selectedActivity.messages.map((message) => (
                        <li
                          key={message.id}
                          className="space-y-1"
                        >
                          <p className="text-sm font-medium">{message.author.name}</p>
                          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Zde se zobrazí zprávy k tomuto tréninku.
                    </p>
                  )}
                </section>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
