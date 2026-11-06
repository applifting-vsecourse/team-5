import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { Check, ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useMoveCurrentStep } from "@/lib/useMoveCurrentStep"
import { cn } from "@/lib/utils"

import type { TrainingDetail } from "@/features/training/api/trainingSchemas"
import { startExerciseIndex } from "@/features/training/lib/startExerciseIndex"

type TrainingWalkthroughProps = {
  training: TrainingDetail
}

export function TrainingWalkthrough({ training }: TrainingWalkthroughProps) {
  const [currentIndex, setCurrentIndex] = useState(() => startExerciseIndex(training))
  // Optimistic pointer until the parent refetch lands a new currentStepId.
  const [movedPointer, setMovedPointer] = useState<{
    basedOn: string | null
    value: string | null
  } | null>(null)
  const moveStep = useMoveCurrentStep(training.goal.id, training.dog.id, training.id)

  const pointerId =
    movedPointer?.basedOn === training.currentStepId ? movedPointer.value : training.currentStepId

  const exercises = training.exercises
  const totalExercises = exercises.length
  const currentExercise = exercises[currentIndex]
  const isLast = currentIndex === totalExercises - 1
  const isBusy = moveStep.isPending
  const isPointerInThisTraining =
    pointerId == null || exercises.some((exercise) => exercise.id === pointerId)
  // Null means the first step of the whole goal. Only treat index 0 as that
  // step when the pointer is not known to live in another training (#66 AC6).
  const isOnCurrentStep =
    currentExercise != null &&
    (pointerId === currentExercise.id ||
      (pointerId == null && isPointerInThisTraining && currentIndex === 0))

  const followPointer = (currentStepId: string | null) => {
    setMovedPointer({ basedOn: training.currentStepId, value: currentStepId })
    if (!currentStepId) {
      setCurrentIndex(0)
      return
    }
    const next = exercises.findIndex((exercise) => exercise.id === currentStepId)
    if (next >= 0) setCurrentIndex(next)
  }

  const runAction = async (action: "advance" | "skip" | "back") => {
    if (!isOnCurrentStep) return
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
              <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                CVIK {currentIndex + 1} ZE {totalExercises}
              </p>
              <div
                className="flex gap-1"
                role="progressbar"
                aria-valuenow={currentIndex + 1}
                aria-valuemin={1}
                aria-valuemax={totalExercises}
                aria-label={`Cvik ${currentIndex + 1} ze ${totalExercises}`}
              >
                {exercises.map((exercise, i) => (
                  <div
                    key={exercise.id}
                    className={cn(
                      "h-1 flex-1 rounded-sm transition-colors",
                      i < currentIndex || exercise.outcome
                        ? "bg-primary"
                        : i === currentIndex
                          ? "bg-primary"
                          : "bg-muted",
                    )}
                  />
                ))}
              </div>
            </div>

            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {currentExercise?.title}
            </h2>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted-foreground">Instrukce</span>
              <p className="text-base text-foreground">
                {currentExercise?.instruction ?? "K tomuto cviku není zadána žádná instrukce."}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted-foreground">Hotovo, když…</span>
              <p className="text-base text-foreground">
                {currentExercise?.criterion ?? "Kritérium nebylo specifikováno."}
              </p>
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                VŠECHNY CVIKY
              </p>
              <div className="flex flex-col">
                {exercises.map((exercise, i) => {
                  const isDone = Boolean(exercise.outcome) || i < currentIndex
                  const isActive = i === currentIndex

                  return (
                    <button
                      key={exercise.id}
                      type="button"
                      onClick={() => setCurrentIndex(i)}
                      aria-current={isActive ? "step" : undefined}
                      className="flex min-h-11 w-full items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                    >
                      {isDone ? (
                        <Check
                          className="size-5 shrink-0 text-muted-foreground"
                          aria-label={`Hotovo: ${exercise.title}`}
                        />
                      ) : (
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center text-sm font-medium",
                            isActive ? "font-semibold text-primary" : "text-muted-foreground",
                          )}
                        >
                          {i + 1}
                        </span>
                      )}
                      <span
                        className={cn(
                          "truncate text-base",
                          isDone && "text-muted-foreground",
                          isActive && "font-semibold text-foreground",
                          !isDone && !isActive && "font-normal text-foreground",
                        )}
                      >
                        {exercise.title}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="min-h-6 flex-1" />

            {!isPointerInThisTraining ? (
              <p className="text-sm text-muted-foreground">
                Aktuální krok cíle je v jiném tréninku. Projděte cviky níže nebo trénink dokončete.
              </p>
            ) : null}

            <div className="flex flex-col gap-2 pt-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  // Back stays available on the first exercise of this training so
                  // the goal pointer can cross into the previous training (#66 AC3).
                  disabled={!isOnCurrentStep || isBusy}
                  onClick={() => void runAction("back")}
                  className="min-h-11 flex-1 text-base"
                >
                  Zpět o krok
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!isOnCurrentStep || isBusy}
                  onClick={() => void runAction("skip")}
                  className="min-h-11 flex-1 text-base"
                >
                  Přeskočit
                </Button>
              </div>
              <Button
                type="button"
                variant="default"
                disabled={!isOnCurrentStep || isBusy}
                onClick={() => void runAction("advance")}
                className="min-h-11 w-full text-base"
              >
                Zvládnuto, další krok
              </Button>
              {isLast || !isPointerInThisTraining ? (
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
