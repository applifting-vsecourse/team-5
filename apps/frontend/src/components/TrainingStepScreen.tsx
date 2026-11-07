import { useEffect, useState, type ReactNode } from "react"
import { Pause, Play, RotateCcw } from "lucide-react"

import { EditorIcon } from "@/components/EditorIcon"
import { Button } from "@/components/ui/button"
import { dogColorClass } from "@/lib/dogColors"
import { cn } from "@/lib/utils"

type Step = {
  id: string
  title: string
  instruction?: string | null
  criterion?: string | null
  durationMinutes?: number
  outcome?: "MASTERED" | "SKIPPED" | null
}

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
}

function StepTimer({ minutes, shouldAutoStart }: { minutes: number; shouldAutoStart: boolean }) {
  const total = Math.max(0, minutes * 60)
  const [elapsed, setElapsed] = useState(0)
  const [isRunning, setRunning] = useState(shouldAutoStart)
  const remaining = Math.max(0, total - elapsed)
  const hasFinished = total > 0 && remaining === 0
  useEffect(() => {
    if (!isRunning || hasFinished) return
    const interval = window.setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => window.clearInterval(interval)
  }, [isRunning, hasFinished])
  const progress = total > 0 ? (remaining / total) * 100 : 0
  return (
    <div className="space-y-4">
      <div
        className="mx-auto flex size-48 items-center justify-center rounded-full p-3"
        style={{ background: `conic-gradient(var(--primary) ${progress}%, var(--secondary) 0)` }}
      >
        <div className="flex size-full flex-col items-center justify-center rounded-full bg-background">
          <p
            role="timer"
            aria-label={total > 0 ? "Zbývající čas" : "Uplynulý čas"}
            className="text-timer font-extrabold tabular-nums"
          >
            {formatTime(total > 0 ? remaining : elapsed)}
          </p>
          <p className="text-sm font-semibold text-muted-foreground">
            {total > 0 ? `z ${formatTime(total)}` : "bez časového limitu"}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-full bg-card"
          aria-label={isRunning && !hasFinished ? "Pozastavit časovač" : "Spustit časovač"}
          disabled={hasFinished}
          onClick={() => setRunning((isCurrentlyRunning) => !isCurrentlyRunning)}
        >
          {isRunning && !hasFinished ? <Pause /> : <Play />}
        </Button>
        <span className="text-sm font-semibold">Čas kroku</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-full bg-card"
          aria-label="Vynulovat časovač"
          onClick={() => {
            setRunning(false)
            setElapsed(0)
          }}
        >
          <RotateCcw />
        </Button>
      </div>
    </div>
  )
}

/** Shared presentation; callers own navigation and decide whether progress is persisted. */
export function TrainingStepScreen({
  title,
  dog,
  steps,
  index,
  closeControl,
  trailingControl,
  actions,
  notice,
  emptyState,
  isPreview = false,
  shouldAutoStartTimer = false,
}: {
  title: string
  dog: { name: string; color: number }
  steps: Step[]
  index: number
  closeControl: ReactNode
  trailingControl?: ReactNode
  actions: ReactNode
  notice?: ReactNode
  emptyState?: ReactNode
  isPreview?: boolean
  shouldAutoStartTimer?: boolean
}) {
  const step = steps[index]
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-gutter pt-4 pb-8">
      <header className="flex items-center gap-3">
        {closeControl}
        <div className="min-w-0 flex-1 text-center">
          <h1 className="text-sm font-extrabold break-words">{title}</h1>
          <p className="mt-1 flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <span
              aria-hidden
              className={cn("size-2 rounded-full", dogColorClass(dog.color))}
            />
            {dog.name} · krok {steps.length ? index + 1 : 0} ze {steps.length}
          </p>
        </div>
        {trailingControl}
      </header>
      {!step ? (
        emptyState
      ) : (
        <>
          <div
            className="flex gap-1.5"
            role="progressbar"
            aria-valuenow={index + 1}
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-label={`Krok ${index + 1} ze ${steps.length}`}
          >
            {steps.map((item, i) => (
              <span
                key={item.id}
                className={cn(
                  "h-1.5 min-w-0 flex-1 rounded-full",
                  i === index
                    ? "bg-primary"
                    : item.outcome === "MASTERED" || (isPreview && i < index)
                      ? "bg-success-foreground"
                      : item.outcome === "SKIPPED"
                        ? "bg-warning-foreground"
                        : "bg-border",
                )}
              />
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-extrabold tracking-wide text-primary uppercase">
              Krok {index + 1} ze {steps.length}
            </p>
            <h2 className="text-title font-extrabold tracking-tight break-words">{step.title}</h2>
            <p className="leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {step.instruction?.trim() ? step.instruction : "Instrukce zatím nejsou doplněné."}
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-card bg-accent p-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-primary text-primary-foreground">
              <EditorIcon name="PreviewTarget" />
            </span>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-primary">Hotovo, když…</h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {step.criterion?.trim() ? step.criterion : "Kritérium zatím není doplněné."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-2 text-xs font-semibold">
              <EditorIcon name="Clock" />
              {step.durationMinutes ? `${step.durationMinutes} min` : "Bez časového limitu"}
            </span>
            {isPreview && (
              <span className="rounded-full bg-secondary px-3 py-2 text-xs text-muted-foreground">
                Postup se v náhledu neukládá
              </span>
            )}
          </div>
          <div className="my-auto py-2">
            <StepTimer
              key={step.id}
              minutes={step.durationMinutes ?? 0}
              shouldAutoStart={shouldAutoStartTimer}
            />
          </div>
          {notice}
          <div className="space-y-3">{actions}</div>
        </>
      )}
    </div>
  )
}
