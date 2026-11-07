import { useState } from "react"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { format } from "date-fns"
import { cs } from "date-fns/locale"
import { History } from "lucide-react"

import { DesignIcon } from "@/components/DesignIcon"
import { EmptyState } from "@/components/EmptyState"
import { QueryState } from "@/components/QueryState"
import { TrainingConversationDialog } from "@/components/TrainingConversationDialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { todayCalendarDate } from "@/lib/calendarDate"
import { dogColorClass } from "@/lib/dogColors"
import { accessibleDogsQueryOptions, historyQueryOptions, type HistoryItem } from "@/lib/history"
import { cn } from "@/lib/utils"

const WEEKDAY_ABBR = ["NE", "PO", "ÚT", "ST", "ČT", "PÁ", "SO"]

function formatDayGroupHeader(date: Date, isToday: boolean): string {
  const wd = WEEKDAY_ABBR[date.getDay()] ?? ""
  const dayAndMonth = format(date, "d. M.")
  return isToday ? `DNES · ${wd} ${dayAndMonth}` : `${wd} ${dayAndMonth}`
}

function formatMonthInCzechLocative(monthStr: string): string {
  const monthNum = parseInt(monthStr.slice(5, 7), 10)
  const locatives = [
    "v lednu",
    "v únoru",
    "v březnu",
    "v dubnu",
    "v květnu",
    "v červnu",
    "v červenci",
    "v srpnu",
    "v září",
    "v říjnu",
    "v listopadu",
    "v prosinci",
  ]
  const locative = locatives[monthNum - 1]
  return locative ?? `· ${monthStr}`
}

function formatTotalDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0 && mins > 0) return `${hours} h ${mins} min`
  if (hours > 0) return `${hours} h`
  return `${mins} min`
}

function HistoryRecord({ record, onOpen }: { record: HistoryItem; onOpen: () => void }) {
  return (
    <li className="relative flex min-w-0 items-start gap-3 pb-3 last:pb-0">
      <span
        aria-hidden
        className={cn("mt-5 size-2.5 shrink-0 rounded-full", dogColorClass(record.dog.color))}
      />
      <Button
        type="button"
        variant="ghost"
        onClick={onOpen}
        aria-label={`Otevřít záznam ${record.title}`}
        className="h-auto min-w-0 flex-1 flex-col items-stretch gap-2 rounded-card border border-border bg-card p-4 text-left whitespace-normal hover:bg-card/90"
      >
        <span className="flex items-start justify-between gap-3">
          <span className="text-sm font-extrabold break-words">{record.title}</span>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-extrabold",
              record.status === "SKIPPED"
                ? "bg-secondary text-muted-foreground"
                : record.successRate !== null && record.successRate < 75
                  ? "bg-warning text-warning-foreground"
                  : "bg-success text-success-foreground",
            )}
          >
            {record.status === "SKIPPED"
              ? "Přeskočeno"
              : record.successRate === null
                ? "Hotovo"
                : `${record.successRate} %`}
          </span>
        </span>
        <span className="text-xs font-normal text-muted-foreground">
          {record.dog.name} · {format(record.completedAt, "HH:mm")}
          {record.status === "SKIPPED"
            ? " · —"
            : record.plannedDurationMinutes !== null
              ? ` · ${record.plannedDurationMinutes} min`
              : ""}
        </span>
        {record.note && (
          <span className="line-clamp-2 text-sm leading-relaxed font-normal">{record.note}</span>
        )}
        {record.messageCount > 0 && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-primary">
            <DesignIcon name="history-Msg1" />
            {record.lastMessage?.author.name ? `${record.lastMessage.author.name} · ` : ""}
            {record.messageCount}{" "}
            {record.messageCount === 1
              ? "komentář"
              : record.messageCount < 5
                ? "komentáře"
                : "komentářů"}
          </span>
        )}
      </Button>
    </li>
  )
}

export function HistoryView({ initialDogId }: { initialDogId?: string }) {
  const [dogId, setDog] = useState(initialDogId)
  const [month, setMonth] = useState<string | undefined>()
  const [isCommentsOnly, setCommentsOnly] = useState(false)
  const [isFilterOpen, setFilterOpen] = useState(false)
  const [draftMonth, setDraftMonth] = useState("")
  const [activityId, setActivity] = useState<string | null>(null)
  const dogs = useQuery(accessibleDogsQueryOptions())
  const history = useInfiniteQuery(
    historyQueryOptions({ dogId, month, commentsOnly: isCommentsOnly }),
  )
  const first = history.data?.pages[0]
  const items = [
    ...new Map(
      (history.data?.pages.flatMap((page) => page.items) ?? []).map((item) => [item.id, item]),
    ).values(),
  ]
  const groups = new Map<string, HistoryItem[]>()
  items.forEach((item) => {
    const day = format(item.completedAt, "yyyy-MM-dd")
    groups.set(day, [...(groups.get(day) ?? []), item])
  })
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-gutter pt-4 pb-6 md:py-8">
      <header className="flex items-center gap-3">
        <Button
          asChild
          variant="outline"
          size="icon"
          className="shrink-0 rounded-field bg-card"
        >
          {initialDogId ? (
            <Link
              to="/dogs/$dogId"
              params={{ dogId: initialDogId }}
              aria-label="Zpět na psa"
            >
              <DesignIcon name="history-ChevL" />
            </Link>
          ) : (
            <Link
              to="/dogs"
              aria-label="Zpět na psy"
            >
              <DesignIcon name="history-ChevL" />
            </Link>
          )}
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-page font-extrabold tracking-tight">Historie</h1>
          {first && (
            <p className="text-xs text-muted-foreground">
              {first.total} záznamů
              {first.firstRecordedAt
                ? ` · od ${format(first.firstRecordedAt, "MMMM yyyy", { locale: cs })}`
                : ""}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 rounded-field bg-card"
          aria-label="Filtrovat historii"
          onClick={() => {
            setDraftMonth(month ?? "")
            setFilterOpen(true)
          }}
        >
          <DesignIcon name="history-Filter" />
        </Button>
      </header>
      <QueryState
        isLoading={dogs.isLoading}
        error={dogs.error}
        onRetry={() => void dogs.refetch()}
        empty={null}
      >
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-pressed={!dogId}
            onClick={() => setDog(undefined)}
            className={cn(
              "rounded-full text-xs",
              !dogId && "border-hero bg-hero text-hero-foreground",
            )}
          >
            Všichni psi
          </Button>
          {dogs.data?.map((dog) => (
            <Button
              key={dog.id}
              type="button"
              size="sm"
              variant="outline"
              aria-pressed={dogId === dog.id}
              onClick={() => setDog(dog.id)}
              className={cn(
                "rounded-full text-xs",
                dogId === dog.id && "border-hero bg-hero text-hero-foreground",
              )}
            >
              <span
                aria-hidden
                className={cn("size-2 rounded-full", dogColorClass(dog.color))}
              />
              {dog.name}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-pressed={isCommentsOnly}
            onClick={() => setCommentsOnly(!isCommentsOnly)}
            className={cn(
              "rounded-full text-xs",
              isCommentsOnly && "border-hero bg-hero text-hero-foreground",
            )}
          >
            <DesignIcon name="history-Msg" />
            Jen s komentářem
          </Button>
          {month && (
            <span className="inline-flex items-center text-xs text-muted-foreground">{month}</span>
          )}
        </div>
      </QueryState>
      <QueryState
        isLoading={history.isLoading}
        error={history.error}
        onRetry={() => void history.refetch()}
        empty={null}
        errorTitle="Historii se nepodařilo načíst"
      >
        {first && (
          <section
            className="grid grid-cols-3 gap-3 rounded-card bg-hero p-4 text-hero-foreground"
            aria-label="Měsíční souhrn"
          >
            <div>
              <p className="text-2xl font-extrabold">{first.summary.completedSessions}</p>
              <p className="mt-1 text-xs text-hero-muted">
                tréninků {formatMonthInCzechLocative(first.summary.month)}
              </p>
            </div>
            <div>
              <p className="text-2xl font-extrabold">
                {first.summary.successRate === null ? "—" : `${first.summary.successRate} %`}
              </p>
              <p className="mt-1 text-xs text-hero-muted">průměr</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold">
                {first.summary.plannedDurationMinutes
                  ? formatTotalDuration(first.summary.plannedDurationMinutes)
                  : first.summary.trainedDays}
              </p>
              <p className="mt-1 text-xs text-hero-muted">
                {first.summary.plannedDurationMinutes ? "celkem" : "aktivních dní"}
              </p>
            </div>
          </section>
        )}
        {!items.length && (
          <div className="mt-6">
            <EmptyState
              icon={History}
              titleAs="p"
              title="Žádné záznamy pro tento výběr"
              description="Zkus jiného psa či období. Po dokončení tréninku se záznam objeví tady."
            />
          </div>
        )}
        <div className="mt-6 space-y-6">
          {[...groups].map(([day, records]) => (
            <section
              key={day}
              aria-labelledby={`history-${day}`}
            >
              <h2
                id={`history-${day}`}
                className="mb-3 text-xs font-extrabold tracking-wide text-muted-foreground uppercase"
              >
                {formatDayGroupHeader(records[0]!.completedAt, day === todayCalendarDate())}
              </h2>
              <ol>
                {records.map((record) => (
                  <HistoryRecord
                    key={record.id}
                    record={record}
                    onOpen={() => setActivity(record.id)}
                  />
                ))}
              </ol>
            </section>
          ))}
        </div>
        {history.hasNextPage && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="mt-6 w-full bg-card font-bold"
            disabled={history.isFetchingNextPage}
            onClick={() => void history.fetchNextPage()}
          >
            <DesignIcon name="history-ChevD" />
            {history.isFetchingNextPage ? "Načítám…" : "Načíst starší záznamy"}
          </Button>
        )}
        {first && first.total > 0 && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Zobrazeno {items.length} z {first.total}
          </p>
        )}
      </QueryState>
      <Dialog
        open={isFilterOpen}
        onOpenChange={setFilterOpen}
      >
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>Filtrovat historii</DialogTitle>
            <DialogDescription>Vyber měsíc, nebo zobraz všechna období.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="history-month">Měsíc</Label>
            <Input
              id="history-month"
              type="month"
              value={draftMonth}
              onChange={(event) => setDraftMonth(event.target.value)}
              min="1900-01"
              max="2099-12"
            />
          </div>
          <Button
            onClick={() => {
              setMonth(draftMonth || undefined)
              setFilterOpen(false)
            }}
          >
            Použít filtr
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setMonth(undefined)
              setDraftMonth("")
              setFilterOpen(false)
            }}
          >
            Všechna období
          </Button>
        </DialogContent>
      </Dialog>
      <TrainingConversationDialog
        activityId={activityId}
        onClose={() => setActivity(null)}
      />
    </div>
  )
}
