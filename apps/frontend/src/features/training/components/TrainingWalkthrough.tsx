import { useEffect, useState } from "react"
import { Link } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { useMoveCurrentStep } from "@/lib/useMoveCurrentStep"

import type { TrainingDetail } from "@/features/training/api/trainingSchemas"
import { startExerciseIndex } from "@/features/training/lib/startExerciseIndex"

type TrainingWalkthroughProps = {
  training: TrainingDetail
}

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

/** Remount with a new key when the exercise changes so elapsed time resets without setState-in-effect. */
function StepTimer() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <p
      className="text-timer font-extrabold tabular-nums text-foreground"
      aria-live="polite"
      aria-label={`Čas na cviku ${formatElapsed(elapsedSeconds)}`}
    >
      {formatElapsed(elapsedSeconds)}
    </p>
  )
}

export function TrainingWalkthrough({ training }: TrainingWalkthroughProps) {
  const [currentIndex, setCurrentIndex] = useState(() => startExerciseIndex(training))
  const moveStep = useMoveCurrentStep(training.goal.id, training.dog.id, training.id)

  const exercises = training.exercises
  const totalExercises = exercises.length
  const currentExercise = exercises[currentIndex]
  const isFirst = currentIndex === 0
  const isLast = currentIndex === totalExercises - 1
  const isBusy = moveStep.isPending
  const filledCount = exercises.filter((exercise) => exercise.outcome).length

  const followPointer = (currentStepId: string | null) => {
    if (!currentStepId) {
      setCurrentIndex(0)
      return
    }
    const next = exercises.findIndex((exercise) => exercise.id === currentStepId)
    if (next >= 0) setCurrentIndex(next)
  }

  const runAction = async (action: "advance" | "skip" | "back") => {
    try {
      const goal = await moveStep.mutateAsync(action)
      followPointer(goal.currentStepId)
    } catch {
      // Hook already toasted.
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-2xl flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
        <Link
          to="/week"
          aria-label="Zpět na týden"
          className="-ml-2 inline-flex size-11 shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
        >
          <ChevronLeft className="size-6" />
        </Link>
        <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
          Trénink · {training.dog.name}
        </h1>
      </header>

      <div className="flex flex-1 flex-col gap-5 px-4 py-6">
        {totalExercises === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <p className="text-base text-muted-foreground">Tento trénink zatím nemá žádné cviky.</p>
            <Button
              asChild
              variant="outline"
              className="min-h-11"
            >
              <Link to="/week">Zpět na týden</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                  CVIK {currentIndex + 1} ZE {totalExercises}
                </p>
                <StepTimer key={currentExercise?.id ?? currentIndex} />
              </div>
              <div
                className="flex gap-1"
                role="progressbar"
                aria-valuenow={Math.max(filledCount, currentIndex + 1)}
                aria-valuemin={1}
                aria-valuemax={totalExercises}
                aria-label={`Cvik ${currentIndex + 1} ze ${totalExercises}, hotovo ${filledCount}`}
              >
                {exercises.map((exercise, i) => (
                  <div
                    key={exercise.id}
                    className={cn(
                      "h-1.5 flex-1 rounded-sm transition-colors",
                      exercise.outcome || i < currentIndex || i === currentIndex
                        ? "bg-primary"
                        : "bg-muted",
                    )}
                  />
                ))}
              </div>
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
              {currentExercise?.title}
            </h2>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted-foreground">Instrukce</span>
              <p className="text-base leading-relaxed text-foreground">
                {currentExercise?.instruction ?? "K tomuto cviku není zadána žádná instrukce."}
              </p>
            </div>

            <div className="rounded-card border border-border bg-card px-4 py-4 text-card-foreground">
              <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                Hotovo, když…
              </span>
              <p className="mt-2 text-lg font-bold leading-snug text-foreground">
                {currentExercise?.criterion ?? "Kritérium nebylo specifikováno."}
              </p>
            </div>

            <div className="min-h-6 flex-1" />

            <div className="flex flex-col gap-2 pt-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isFirst || isBusy}
                  onClick={() => void runAction("back")}
                  className="min-h-11 flex-1 text-base"
                >
                  Zpět o krok
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isBusy}
                  onClick={() => void runAction("skip")}
                  className="min-h-11 flex-1 text-base"
                >
                  Přeskočit
                </Button>
              </div>
              <Button
                type="button"
                variant="default"
                disabled={isBusy}
                onClick={() => void runAction("advance")}
                className="min-h-11 w-full text-base"
              >
                Zvládnuto
              </Button>
              {isLast ? (
                <Button
                  asChild
                  variant="secondary"
                  className="min-h-11 w-full text-base"
                >
                  <Link
                    to="/trainings/$trainingId/finish"
                    params={{ trainingId: training.id }}
                  >
                    Dokončit trénink
                  </Link>
                </Button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
