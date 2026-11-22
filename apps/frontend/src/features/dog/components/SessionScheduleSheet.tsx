import { useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { cs } from "react-day-picker/locale"

import { EditorIcon } from "@/components/EditorIcon"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { api } from "@/lib/api-client"
import { todayCalendarDate } from "@/lib/calendarDate"
import { dogKeys } from "@/lib/dogKeys"
import { weekKeys } from "@/lib/weekKeys"

import { goalTrainingsQueryOptions } from "@/features/dog/api/dogsQueryOptions"

import { EditorSheet } from "./EditorSheet"

export const localDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

const trainingCount = (count: number) =>
  `${count} ${count === 1 ? "trénink" : count >= 2 && count <= 4 ? "tréninky" : "tréninků"}`

type SessionScheduleSheetProps = {
  sessionId: string
  goalId: string
  dogId: string
  description: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onBack?: () => void
  onScheduled?: () => void
}

function SessionScheduleContent({
  sessionId,
  goalId,
  dogId,
  onOpenChange,
  onBack,
  onBusyChange,
  onScheduled,
}: Omit<SessionScheduleSheetProps, "isOpen" | "description"> & {
  onBusyChange: (isBusyNext: boolean) => void
}) {
  const client = useQueryClient()
  const planned = useQuery(goalTrainingsQueryOptions(goalId))
  const [days, setDays] = useState<Date[]>([])
  const [isPending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isBusy = useRef(false)
  const unavailable = (planned.data ?? [])
    .filter((t) => t.status === "PLANNED" && (!t.trainingId || t.trainingId === sessionId))
    .map((t) => t.date)
  const submit = async () => {
    if (isBusy.current) return
    if (!days.length) {
      setError("Vyber alespoň jeden den.")
      return
    }
    isBusy.current = true
    onBusyChange(true)
    setPending(true)
    setError(null)
    const saved = new Set<string>()
    try {
      // Remember successes individually: retry after a partial failure never duplicates them.
      for (const day of [...days].sort((a, b) => a.getTime() - b.getTime())) {
        await api.post(`goal-trainings/${sessionId}/schedule`, { json: { date: localDay(day) } })
        saved.add(localDay(day))
      }
      setDays([])
      onOpenChange(false)
      onScheduled?.()
    } catch {
      setDays((current) => current.filter((day) => !saved.has(localDay(day))))
      setError(
        "Některé tréninky se nepodařilo naplánovat. Úspěšně uložené dny zůstávají v kalendáři; zkus zbývající znovu.",
      )
    } finally {
      await Promise.all([
        client.invalidateQueries({ queryKey: dogKeys.all }),
        client.invalidateQueries({ queryKey: dogKeys.detail(dogId) }),
        client.invalidateQueries({ queryKey: weekKeys.all }),
      ])
      isBusy.current = false
      onBusyChange(false)
      setPending(false)
    }
  }
  return (
    <>
      {onBack && (
        <Button
          variant="outline"
          className="mb-3 w-full"
          disabled={isPending}
          onClick={onBack}
        >
          Změnit cíl nebo trénink
        </Button>
      )}
      {planned.isLoading ? (
        <p role="status">Načítám naplánované dny…</p>
      ) : planned.isError ? (
        <div role="alert">
          <p>Naplánované dny se nepodařilo načíst.</p>
          <Button
            variant="outline"
            onClick={() => void planned.refetch()}
          >
            Zkusit znovu
          </Button>
        </div>
      ) : (
        <>
          <div data-vaul-no-drag>
            <Calendar
              mode="multiple"
              locale={cs}
              weekStartsOn={1}
              selected={days}
              onSelect={(value) => {
                if (!isPending) setDays(value ?? [])
              }}
              disabled={(date) =>
                isPending ||
                localDay(date) < todayCalendarDate() ||
                unavailable.includes(localDay(date))
              }
              modifiers={{ planned: (date) => unavailable.includes(localDay(date)) }}
              modifiersClassNames={{ planned: "border-b-2 border-success-foreground" }}
              className="w-full p-0 [--cell-size:var(--control-min)]"
              classNames={{
                root: "w-full",
                month_caption: "flex h-touch items-center justify-center",
                caption_label: "text-section font-extrabold",
                day: "min-w-0 flex-1",
                week: "mt-1 flex w-full",
              }}
            />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Vyber jeden nebo více dnů. Označené dny už mají trénink. Naplánované termíny najdeš v
            plánu psa.
          </p>
          {days.length ? (
            <p
              className="my-4 rounded-field bg-accent p-3 text-sm text-accent-foreground"
              aria-live="polite"
            >
              Náhled: {trainingCount(days.length)} ·{" "}
              {[...days]
                .sort((a, b) => a.getTime() - b.getTime())
                .map((d) => d.toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" }))
                .join(", ")}
            </p>
          ) : null}
          {error ? (
            <p
              role="alert"
              className="my-3 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}
          <Button
            type="button"
            size="lg"
            className="mt-4 w-full"
            disabled={isPending}
            onClick={() => void submit()}
          >
            <EditorIcon name="Cal" />
            {isPending
              ? "Plánuji…"
              : `Naplánovat${days.length ? ` ${trainingCount(days.length)}` : ""}`}
          </Button>
        </>
      )}
    </>
  )
}

export function SessionScheduleSheet({
  sessionId,
  goalId,
  dogId,
  description,
  isOpen,
  onOpenChange,
  onBack,
  onScheduled,
}: SessionScheduleSheetProps) {
  const isBusy = useRef(false)
  return (
    <EditorSheet
      isOpen={isOpen}
      onOpenChange={(isNextOpen) => {
        if (!isBusy.current) onOpenChange(isNextOpen)
      }}
      title="Naplánovat trénink"
      description={description}
    >
      {isOpen && (
        <SessionScheduleContent
          sessionId={sessionId}
          goalId={goalId}
          dogId={dogId}
          onOpenChange={onOpenChange}
          onBack={onBack}
          onScheduled={onScheduled}
          onBusyChange={(isBusyNext) => {
            isBusy.current = isBusyNext
          }}
        />
      )}
    </EditorSheet>
  )
}
