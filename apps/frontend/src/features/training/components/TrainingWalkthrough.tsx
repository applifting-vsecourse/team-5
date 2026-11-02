import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { Check, ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

import type { TrainingDetail } from "@/features/training/api/trainingSchemas"

type TrainingWalkthroughProps = {
  training: TrainingDetail
}

export function TrainingWalkthrough({ training }: TrainingWalkthroughProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const exercises = training.exercises
  const totalExercises = exercises.length
  const currentExercise = exercises[currentIndex]
  const isFirst = currentIndex === 0
  const isLast = currentIndex === totalExercises - 1

  return (
    <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-2xl flex-col bg-background">
      {/* Subpage Header matching Figma node 51:303 */}
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

      {/* Main content */}
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
            {/* Progress indicators */}
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
                {exercises.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-sm transition-colors",
                      i <= currentIndex ? "bg-primary" : "bg-muted",
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Current exercise */}
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {currentExercise?.title}
            </h2>

            {/* Instruction */}
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted-foreground">Instrukce</span>
              <p className="text-base text-foreground">
                {currentExercise?.instruction ?? "K tomuto cviku není zadána žádná instrukce."}
              </p>
            </div>

            {/* Mastery criterion */}
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted-foreground">Kritérium zvládnutí</span>
              <p className="text-base text-foreground">
                {currentExercise?.criterion ?? "Kritérium nebylo specifikováno."}
              </p>
            </div>

            {/* Hairline divider */}
            <Separator />

            {/* All exercises list */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                VŠECHNY CVIKY
              </p>
              <div className="flex flex-col">
                {exercises.map((exercise, i) => {
                  const isCompleted = i < currentIndex
                  const isActive = i === currentIndex

                  return (
                    <button
                      key={exercise.id}
                      type="button"
                      onClick={() => setCurrentIndex(i)}
                      aria-current={isActive ? "step" : undefined}
                      className="flex min-h-11 w-full items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                    >
                      {isCompleted ? (
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
                          isCompleted && "text-muted-foreground",
                          isActive && "font-semibold text-foreground",
                          !isCompleted && !isActive && "font-normal text-foreground",
                        )}
                      >
                        {exercise.title}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Flexible spacer */}
            <div className="min-h-6 flex-1" />

            {/* Navigation buttons at bottom */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={isFirst}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="min-h-11 flex-1 text-base"
              >
                Předchozí
              </Button>
              {isLast ? (
                <Button
                  asChild
                  variant="default"
                  className="min-h-11 flex-1 text-base"
                >
                  <Link
                    to="/trainings/$trainingId/finish"
                    params={{ trainingId: training.id }}
                  >
                    Dokončit
                  </Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="default"
                  onClick={() => setCurrentIndex((prev) => Math.min(totalExercises - 1, prev + 1))}
                  className="min-h-11 flex-1 text-base"
                >
                  Další cvik
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
