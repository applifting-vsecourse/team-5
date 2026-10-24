import { useEffect, useState } from "react"
import { Bell, CheckCircle2, ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { dogColorClass } from "@/lib/dogColors"
import { cn } from "@/lib/utils"

import type { WeekTraining } from "@/features/week/api/weekQueryOptions"

type FieldTrainingDrawerProps = {
  training: WeekTraining | null
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

function playCompletionBeep() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(880, ctx.currentTime) // A5 tone
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
  } catch {
    // AudioContext blocked or unsupported in environment
  }
}

function FieldTrainingSession({
  training,
  onClose,
}: {
  training: WeekTraining
  onClose: () => void
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [timerSeconds, setTimerSeconds] = useState(30)
  const [timerRemaining, setTimerRemaining] = useState(30)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  // Screen Wake Lock while session is active
  useEffect(() => {
    let sentinel: WakeLockSentinel | null = null

    if ("wakeLock" in navigator && typeof navigator.wakeLock.request === "function") {
      void navigator.wakeLock
        .request("screen")
        .then((lock) => {
          sentinel = lock
        })
        .catch(() => undefined)
    }

    return () => {
      if (sentinel) {
        void sentinel.release().catch(() => undefined)
      }
    }
  }, [])

  // Timer countdown
  useEffect(() => {
    if (!isTimerRunning) return

    const interval = window.setInterval(() => {
      setTimerRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setIsTimerRunning(false)
          playCompletionBeep()
          if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
            navigator.vibrate([100, 50, 100])
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isTimerRunning])

  const exercises = training.exercises ?? []
  const currentExercise = exercises[currentStepIndex]
  const hasExercises = exercises.length > 0

  const handleStartTimer = (seconds: number) => {
    setTimerSeconds(seconds)
    setTimerRemaining(seconds)
    setIsTimerRunning(true)
    if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
      navigator.vibrate(20)
    }
  }

  const toggleTimer = () => {
    if (timerRemaining === 0) {
      setTimerRemaining(timerSeconds)
    }
    setIsTimerRunning((isPrevRunning) => !isPrevRunning)
    if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
      navigator.vibrate(15)
    }
  }

  const resetTimer = () => {
    setIsTimerRunning(false)
    setTimerRemaining(timerSeconds)
  }

  return (
    <>
      <DrawerHeader className="border-b border-border pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={cn("size-3 rounded-full", dogColorClass(training.dog.color))}
            />
            <span className="text-sm font-semibold text-foreground">{training.dog.name}</span>
          </div>
          <Badge
            variant="outline"
            className="text-xs"
          >
            Režim na cvičišti
          </Badge>
        </div>
        <DrawerTitle className="mt-1 text-xl font-bold">{training.goal.title}</DrawerTitle>
        <DrawerDescription>
          {hasExercises
            ? `Cvik ${currentStepIndex + 1} z ${exercises.length}`
            : "Tento plán zatím neobsahuje žádné cviky."}
        </DrawerDescription>
      </DrawerHeader>

      <div className="space-y-6 py-4">
        {/* Current Exercise Card */}
        {hasExercises && currentExercise ? (
          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {currentStepIndex + 1}
              </span>
              <h3 className="flex-1 text-base font-semibold text-foreground">
                {currentExercise.title}
              </h3>
            </div>

            <div className="rounded-lg bg-secondary/60 p-3">
              <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Aktivní cvik v tréninku
              </div>
              <div className="mt-1 text-sm font-medium text-foreground">
                Soustřeďte se na přesné provedení cviku. Použijte stopky níže pro měření výdrže nebo
                odložení.
              </div>
            </div>

            {/* Step Navigation */}
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11"
                disabled={currentStepIndex === 0}
                onClick={() => {
                  setCurrentStepIndex((i) => Math.max(0, i - 1))
                  resetTimer()
                }}
              >
                <ChevronLeft className="mr-1 size-4" />
                Předchozí
              </Button>
              <span className="text-xs text-muted-foreground">
                {currentStepIndex + 1} / {exercises.length}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11"
                disabled={currentStepIndex >= exercises.length - 1}
                onClick={() => {
                  setCurrentStepIndex((i) => Math.min(exercises.length - 1, i + 1))
                  resetTimer()
                }}
              >
                Další
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            V plánu není definován žádný cvik. Můžete cvičit volný trénink.
          </div>
        )}

        {/* Training Interval Timer */}
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <Bell className="size-3.5" />
              Stopky pro odložení a intervaly
            </span>
            <div className="flex items-center gap-1">
              {[15, 30, 60].map((sec) => (
                <Button
                  key={sec}
                  type="button"
                  variant={timerSeconds === sec ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => handleStartTimer(sec)}
                >
                  {sec}s
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 py-2">
            <span className="font-mono text-4xl font-bold tracking-tight text-foreground">
              {String(Math.floor(timerRemaining / 60)).padStart(2, "0")}:
              {String(timerRemaining % 60).padStart(2, "0")}
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={isTimerRunning ? "outline" : "default"}
                size="icon"
                className="size-12 rounded-full"
                onClick={toggleTimer}
                aria-label={isTimerRunning ? "Pozastavit stopky" : "Spustit stopky"}
              >
                {isTimerRunning ? <Pause className="size-5" /> : <Play className="ml-0.5 size-5" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10 rounded-full"
                onClick={resetTimer}
                aria-label="Vynulovat stopky"
              >
                <RotateCcw className="size-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Exit */}
        <Button
          type="button"
          className="min-h-12 w-full text-base font-medium"
          onClick={() => {
            if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
              navigator.vibrate(30)
            }
            onClose()
          }}
        >
          <CheckCircle2 className="mr-2 size-5" />
          Zavřít režim na cvičišti
        </Button>
      </div>
    </>
  )
}

export function FieldTrainingDrawer({ training, isOpen, onOpenChange }: FieldTrainingDrawerProps) {
  return (
    <Drawer
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DrawerContent className="mx-auto max-w-xl">
        {training && (
          <FieldTrainingSession
            key={training.id}
            training={training}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DrawerContent>
    </Drawer>
  )
}
