import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Calendar, ChevronLeft, ChevronRight, FileText } from "lucide-react"

import { EmptyState } from "@/components/EmptyState"
import { QueryState } from "@/components/QueryState"
import { StatusChip } from "@/components/StatusChip"
import { StripCard } from "@/components/StripCard"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import type { DogActivity } from "@/features/dog/api/dogSchemas"
import { dogActivitiesQueryOptions } from "@/features/dog/api/dogsQueryOptions"

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

  // A dog's records come from the API one page at a time (#79); records passed
  // in are paged here.
  const isPagedByApi = Boolean(dogId) && initialActivities === undefined
  const activitiesQuery = useQuery({
    ...dogActivitiesQueryOptions(dogId ?? "", page, ITEMS_PER_PAGE),
    enabled: isPagedByApi,
  })

  const localActivities = initialActivities ?? []
  const total = isPagedByApi ? (activitiesQuery.data?.total ?? 0) : localActivities.length
  const startIndex = (page - 1) * ITEMS_PER_PAGE
  const currentItems = isPagedByApi
    ? (activitiesQuery.data?.items ?? [])
    : localActivities.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  // Resolve from current query data so a refreshed author cannot remain in an
  // already open dialog after the trainer deletes their account.
  const selectedActivity = currentItems.find((activity) => activity.id === selectedActivityId)

  // The compact list is always the first page, without paging.
  const totalPages = isCompact ? 1 : Math.ceil(total / ITEMS_PER_PAGE) || 1
  // Fewer records than before (e.g. a skip taken back) can leave the page past
  // the end: go to the last one instead of an empty list.
  const isTotalKnown = !isPagedByApi || activitiesQuery.data !== undefined
  if (isTotalKnown && page > totalPages) setPage(totalPages)

  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  const emptyState = (
    <EmptyState
      icon={Calendar}
      chip="BEZ ZÁZNAMŮ"
      titleAs="p"
      title={`${dogName} zatím nemá zaznamenané žádné tréninky`}
      description="Po prvním odcvičeném tréninku se záznamy objeví tady."
    />
  )

  const activityList = (
    <ul className="flex flex-col gap-3">
      {currentItems.map((item) => {
        const isCompleted = item.status === "completed"

        return (
          <StripCard
            key={item.id}
            as="li"
          >
            <button
              type="button"
              className="group flex w-full items-start justify-between gap-3 px-4 py-3 text-left outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              onClick={() => setSelectedActivityId(item.id)}
              aria-label={`Otevřít detail aktivity ${item.title}`}
            >
              <div>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar
                    aria-hidden="true"
                    className="size-3.5"
                  />
                  {formatActivityDate(item.completedAt, item.date)}
                </span>
                <span className="mt-1 block font-semibold text-foreground transition-colors group-hover:text-primary">
                  {item.title}
                </span>
              </div>

              <StatusChip tone={isCompleted ? "success" : "muted"}>
                {isCompleted ? "Odcvičeno" : "Přeskočeno"}
              </StatusChip>
            </button>
          </StripCard>
        )
      })}
    </ul>
  )

  return (
    <section
      className="space-y-4"
      aria-labelledby="activities-heading"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2
            id="activities-heading"
            className="text-section font-extrabold text-foreground"
          >
            Aktivity
          </h2>
          <p className="text-xs text-muted-foreground">
            {isCompact ? "Poslední záznamy tréninků" : "Záznamy tréninků od nejnovějšího"}
          </p>
        </div>

        {isCompact && dogId && total > 0 && (
          <Link
            to="/dogs/$dogId/activities"
            params={{ dogId }}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground outline-hidden transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Celá historie
            <ChevronRight
              aria-hidden="true"
              className="size-4"
            />
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
              className="size-11"
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
              className="size-11"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {isPagedByApi ? (
        <QueryState
          isLoading={activitiesQuery.isLoading}
          error={
            activitiesQuery.isError
              ? (activitiesQuery.error ??
                new Error("Tréninkové záznamy a zprávy se nepodařilo načíst."))
              : null
          }
          isEmpty={!activitiesQuery.isLoading && !activitiesQuery.isError && total === 0}
          onRetry={() => void activitiesQuery.refetch()}
          loadingLabel="Načítání aktivit"
          errorTitle="Aktivity se nepodařilo načíst"
          errorDescription="Tréninkové záznamy a zprávy se nepodařilo načíst."
          empty={emptyState}
        >
          {activityList}
        </QueryState>
      ) : total === 0 ? (
        emptyState
      ) : (
        activityList
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
                    <Calendar
                      aria-hidden="true"
                      className="size-3.5"
                    />
                    {formatActivityDate(selectedActivity.completedAt, selectedActivity.date)}
                  </span>
                  <StatusChip tone={selectedActivity.status === "completed" ? "success" : "muted"}>
                    {selectedActivity.status === "completed" ? "Odcvičeno" : "Přeskočeno"}
                  </StatusChip>
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
