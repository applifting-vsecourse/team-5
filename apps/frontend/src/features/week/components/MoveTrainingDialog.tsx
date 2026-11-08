import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { DayPicker } from "@/components/DayPicker"
import { DesignIcon } from "@/components/DesignIcon"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  addCalendarDays,
  formatDayAccusative,
  formatDayLong,
  startOfWeekOf,
  todayCalendarDate,
  type CalendarDate,
} from "@/lib/calendarDate"
import { dogColorClass } from "@/lib/dogColors"
import { cn } from "@/lib/utils"

import { weekTrainingsQueryOptions, type WeekTraining } from "@/features/week/api/weekQueryOptions"
import { useMoveTraining } from "@/features/week/hooks/useMoveTraining"
import { useSkipTraining } from "@/features/week/hooks/useSkipTraining"

type Props = {
  training: WeekTraining
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  initialAction?: "move" | "skip"
}

function TrainingActions({ training, onOpenChange, initialAction = "move" }: Props) {
  const today = todayCalendarDate()
  const firstDay = training.date === today ? addCalendarDays(today, 1) : today
  const [selected, setSelected] = useState<CalendarDate>(firstDay)
  const [week, setWeek] = useState(startOfWeekOf(firstDay))
  const [action, setAction] = useState(initialAction)
  const move = useMoveTraining(training.id)
  const skip = useSkipTraining(training.id)
  const occupied = useQuery(weekTrainingsQueryOptions(week))
  const isPending = move.isPending || skip.isPending
  const occupiedDays = (occupied.data ?? [])
    .filter((item) => item.id !== training.id && item.status === "PLANNED")
    .map((item) => item.date)

  const submit = async () => {
    try {
      if (action === "move") await move.mutateAsync(selected)
      else await skip.mutateAsync()
      onOpenChange(false)
    } catch {
      // Hooks report the error; retain the choice for retry.
    }
  }

  return (
    <>
      <div
        aria-hidden
        className="mx-auto h-1 w-10 rounded-full bg-border"
      />
      <DialogClose asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Zavřít"
          disabled={isPending}
          className="absolute top-8 right-5 bg-card"
        >
          <DesignIcon name="move-X" />
        </Button>
      </DialogClose>
      <DialogHeader className="pr-12 text-left">
        <DialogTitle className="text-xl font-extrabold">Co s tréninkem?</DialogTitle>
        <DialogDescription className="flex items-start gap-1.5 text-xs font-semibold">
          <span
            aria-hidden
            className={cn("mt-1 size-2 shrink-0 rounded-full", dogColorClass(training.dog.color))}
          />
          <span>
            {training.dog.name} · {training.training?.title ?? training.goal.title} ·{" "}
            {formatDayLong(training.date)}
          </span>
        </DialogDescription>
      </DialogHeader>
      <ToggleGroup
        type="single"
        value={action}
        onValueChange={(value) => {
          if (value) setAction(value as "move" | "skip")
        }}
        disabled={isPending}
        aria-label="Co s tréninkem"
        className="flex w-full flex-col items-stretch gap-4"
      >
        <div
          className={cn(
            "min-w-0 rounded-card border-2 p-3",
            action === "move" ? "border-primary bg-accent" : "border-border bg-card",
          )}
        >
          <ToggleGroupItem
            value="move"
            className="h-auto w-full justify-start gap-3 rounded-control p-0 text-left whitespace-normal hover:bg-transparent data-[spacing=0]:rounded-control data-[state=on]:bg-transparent"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-primary text-primary-foreground">
              <DesignIcon name="move-Cal" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">Přesunout na jiný den</span>
              <span className="mt-1 block text-xs font-medium text-muted-foreground">
                Vyber den – tečka znamená, že už tam něco je.
              </span>
            </span>
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border",
                action === "move" ? "border-primary bg-primary" : "border-border",
              )}
            >
              {action === "move" && <DesignIcon name="move-Check" />}
            </span>
          </ToggleGroupItem>
          <div className="mt-3">
            <DayPicker
              initialDay={firstDay}
              unavailableDays={[training.date]}
              occupiedDays={occupiedDays}
              isCompact
              hint="Den v minulosti vybrat nejde."
              isPending={isPending}
              onSelectionChange={(day) => {
                setSelected(day)
                setAction("move")
              }}
              onWeekChange={setWeek}
              submitLabel={formatDayLong}
              onPick={setSelected}
            />
            {occupied.isError && (
              <p className="text-xs text-muted-foreground">
                Obsazené dny se nepodařilo načíst.{" "}
                <button
                  type="button"
                  className="min-h-touch underline"
                  onClick={() => void occupied.refetch()}
                >
                  Zkusit znovu
                </button>
              </p>
            )}
          </div>
        </div>
        <ToggleGroupItem
          value="skip"
          className={cn(
            "h-auto w-full justify-start gap-3 rounded-card border-2 p-3 text-left whitespace-normal data-[spacing=0]:rounded-card data-[spacing=0]:first:rounded-card data-[spacing=0]:last:rounded-card",
            action === "skip"
              ? "border-primary bg-accent data-[state=on]:bg-accent"
              : "border-border bg-card",
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-secondary">
            <DesignIcon name="move-Skip" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">Přeskočit tento trénink</span>
            <span className="mt-1 block text-xs font-medium text-muted-foreground">
              Zůstane v Týdnu označený jako přeskočený, další tréninky cíle se neposunou.
            </span>
          </span>
          <span
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full border",
              action === "skip" ? "border-primary bg-primary" : "border-border",
            )}
          >
            {action === "skip" && <DesignIcon name="move-Check" />}
          </span>
        </ToggleGroupItem>
      </ToggleGroup>
      <div className="flex flex-col gap-2.5">
        <Button
          type="button"
          size="lg"
          disabled={isPending}
          className="w-full gap-2"
          onClick={() => void submit()}
        >
          <DesignIcon name="move-Submit" />
          {isPending
            ? "Ukládám…"
            : action === "move"
              ? `Přesunout na ${formatDayAccusative(selected)}`
              : "Přeskočit trénink"}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          disabled={isPending}
          className="w-full bg-card"
          onClick={() => onOpenChange(false)}
        >
          Zrušit
        </Button>
      </div>
    </>
  )
}

export function MoveTrainingDialog(props: Props) {
  return (
    <Dialog
      open={props.isOpen}
      onOpenChange={props.onOpenChange}
    >
      <DialogContent
        showCloseButton={false}
        className="top-auto bottom-0 max-h-[95svh] max-w-full translate-y-0 gap-4 overflow-y-auto rounded-t-sheet rounded-b-none px-gutter pt-3 pb-8 md:top-1/2 md:bottom-auto md:max-w-md md:-translate-y-1/2 md:rounded-sheet"
      >
        {props.isOpen && <TrainingActions {...props} />}
      </DialogContent>
    </Dialog>
  )
}
