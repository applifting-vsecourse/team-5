import { useEffect, useState } from "react"
import { Pause, Play, RotateCcw, SkipForward, Target } from "lucide-react"

import { EmptyState } from "@/components/EmptyState"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { dogColorClass } from "@/lib/dogColors"
import { cn } from "@/lib/utils"

import type { Dog, PlanBlock } from "@/features/dog/api/dogSchemas"

import { EditorIcon } from "./EditorIcon"

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
}

function PreviewTimer({ minutes }: { minutes: number }) {
  const total = Math.max(0, minutes * 60)
  const [remaining, setRemaining] = useState(total)
  const [isRunning, setRunning] = useState(false)
  useEffect(() => {
    if (!isRunning || remaining === 0) return
    const interval = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(interval)
  }, [isRunning, remaining])
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
            aria-label="Zbývající čas"
            className="text-timer font-extrabold tabular-nums"
          >
            {formatTime(remaining)}
          </p>
          <p className="text-sm font-semibold text-muted-foreground">z {formatTime(total)}</p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-full bg-card"
          aria-label={isRunning ? "Pozastavit časovač" : "Spustit časovač"}
          disabled={total === 0 || remaining === 0}
          onClick={() => setRunning((isCurrentlyRunning) => !isCurrentlyRunning)}
        >
          {isRunning ? <Pause /> : <Play />}
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
            setRemaining(total)
          }}
        >
          <RotateCcw />
        </Button>
      </div>
    </div>
  )
}

export function TrainingPreview({
  dog,
  title,
  steps,
  isOpen,
  onOpenChange,
}: {
  dog: Pick<Dog, "name" | "color">
  title: string
  steps: PlanBlock[]
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}) {
  const [index, setIndex] = useState(0)
  const step = steps[index]
  const next = () => {
    if (index + 1 < steps.length) setIndex((value) => value + 1)
    else onOpenChange(false)
  }
  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        showCloseButton={false}
        className="inset-0 block h-dvh max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-none border-0 bg-background p-0 shadow-none sm:max-w-none"
      >
        <DialogTitle className="sr-only">Náhled psovoda</DialogTitle>
        <DialogDescription className="sr-only">
          Náhled tréninku bez ukládání postupu. Zavřením se vrátíš do editoru.
        </DialogDescription>
        <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-6 px-gutter pt-4 pb-8">
          <header className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 rounded-field bg-card"
              aria-label="Zavřít náhled"
              onClick={() => onOpenChange(false)}
            >
              <EditorIcon name="X" />
            </Button>
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
            <span className="min-w-touch text-center text-xs font-bold text-muted-foreground">
              Náhled
            </span>
          </header>
          {!step ? (
            <EmptyState
              icon={Target}
              title="Zatím není co zobrazit"
              description="Nejdřív přidej do tréninku krok."
            />
          ) : (
            <>
              <div
                className="flex gap-1.5"
                aria-label={`Krok ${index + 1} ze ${steps.length}`}
              >
                {steps.map((item, i) => (
                  <span
                    key={item.id}
                    className={cn(
                      "h-1.5 min-w-0 flex-1 rounded-full",
                      i < index
                        ? "bg-success-foreground"
                        : i === index
                          ? "bg-primary"
                          : "bg-border",
                    )}
                  />
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-extrabold tracking-wide text-primary uppercase">
                  Krok {index + 1} ze {steps.length}
                </p>
                <h2 className="text-title font-extrabold tracking-tight break-words">
                  {step.title}
                </h2>
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
                  {step.durationMinutes ?? 0} min
                </span>
                <span className="rounded-full bg-secondary px-3 py-2 text-xs text-muted-foreground">
                  Postup se v náhledu neukládá
                </span>
              </div>
              <div className="my-auto py-2">
                <PreviewTimer
                  key={step.id}
                  minutes={step.durationMinutes ?? 0}
                />
              </div>
              <div className="space-y-3">
                <Button
                  type="button"
                  size="lg"
                  className="w-full text-action font-bold"
                  onClick={next}
                >
                  <EditorIcon name="PreviewCheck" />
                  {index + 1 < steps.length ? "Hotovo, další krok" : "Dokončit náhled"}
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="bg-card"
                    disabled={index === 0}
                    onClick={() => setIndex((value) => value - 1)}
                  >
                    Zpět
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="bg-card"
                    onClick={next}
                  >
                    <SkipForward />
                    Přeskočit krok
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
