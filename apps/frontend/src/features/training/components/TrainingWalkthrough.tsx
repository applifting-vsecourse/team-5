import { useRef, useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { SkipForward } from "lucide-react"

import { EditorIcon } from "@/components/EditorIcon"
import { TrainingStepScreen } from "@/components/TrainingStepScreen"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useMoveCurrentStep } from "@/lib/useMoveCurrentStep"

import type { TrainingDetail } from "@/features/training/api/trainingSchemas"
import { startExerciseIndex } from "@/features/training/lib/startExerciseIndex"

type TrainingWalkthroughProps = {
  training: TrainingDetail
}

export function TrainingWalkthrough({ training }: TrainingWalkthroughProps) {
  const navigate = useNavigate()
  const actionLock = useRef(false)
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
  const isFirstLocal = currentIndex === 0
  const isLastLocal = currentIndex === totalExercises - 1
  const isBusy = moveStep.isPending
  const isPlanned = training.status === "PLANNED"
  // Training detail resolves null to the first step of the whole goal, so a
  // missing id here only means an empty plan — never "this training's first".
  const isPointerInThisTraining =
    pointerId != null && exercises.some((exercise) => exercise.id === pointerId)
  const isPointerElsewhere = !isPointerInThisTraining
  const isOnCurrentStep = pointerId != null && pointerId === currentExercise?.id

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
    if (!isOnCurrentStep || !isPlanned || actionLock.current) return
    actionLock.current = true
    try {
      const goal = await moveStep.mutateAsync(action)
      followPointer(goal.currentStepId)
      if (isLastLocal && action !== "back") {
        void navigate({ to: "/trainings/$trainingId/finish", params: { trainingId: training.id } })
      }
    } catch {
      // Hook reports failure; keep this step and allow retry.
    } finally {
      actionLock.current = false
    }
  }

  return (
    <TrainingStepScreen
      title={training.training?.title ?? training.goal.title}
      dog={training.dog}
      steps={exercises}
      index={currentIndex}
      shouldAutoStartTimer={isPlanned}
      closeControl={
        <Button
          asChild
          variant="outline"
          size="icon"
          className="shrink-0 rounded-field bg-card"
        >
          <Link
            to="/week"
            aria-label="Zpět na týden"
          >
            <EditorIcon name="X" />
          </Link>
        </Button>
      }
      trailingControl={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 rounded-field bg-card"
              aria-label="Možnosti tréninku"
            >
              <EditorIcon name="More" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isPlanned && (
              <DropdownMenuItem asChild>
                <Link
                  to="/trainings/$trainingId/finish"
                  params={{ trainingId: training.id }}
                >
                  Dokončit trénink
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link to="/week">Zpět na týden</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
      emptyState={
        <div className="my-auto space-y-4 text-center">
          <p className="text-muted-foreground">Tento trénink zatím nemá žádné cviky.</p>
          <Button
            asChild
            variant="outline"
          >
            <Link to="/week">Zpět na týden</Link>
          </Button>
        </div>
      }
      notice={
        !isPlanned ? (
          <p className="text-sm text-muted-foreground">
            Trénink je uzavřený. Kroky si můžeš prohlédnout bez změny postupu.
          </p>
        ) : isPointerElsewhere ? (
          <p className="text-sm text-muted-foreground">
            Aktuální krok cíle je v jiném tréninku. Můžeš si projít kroky tohoto tréninku nebo ho
            dokončit.
          </p>
        ) : null
      }
      actions={
        isOnCurrentStep && isPlanned ? (
          <>
            <Button
              type="button"
              size="lg"
              disabled={isBusy}
              onClick={() => void runAction("advance")}
              className="w-full text-action font-bold"
            >
              <EditorIcon name="PreviewCheck" />
              {isLastLocal ? "Hotovo, dokončit" : "Hotovo, další krok"}
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="bg-card"
                disabled={isBusy}
                onClick={() => void runAction("back")}
              >
                Zpět o krok
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="bg-card"
                disabled={isBusy}
                onClick={() => void runAction("skip")}
              >
                <SkipForward />
                Přeskočit krok
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="bg-card"
                disabled={isFirstLocal}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              >
                Předchozí
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="bg-card"
                disabled={isLastLocal}
                onClick={() => setCurrentIndex((prev) => Math.min(totalExercises - 1, prev + 1))}
              >
                Další krok
              </Button>
            </div>
            {isPlanned && (
              <Button
                asChild
                size="lg"
                className="w-full"
              >
                <Link
                  to="/trainings/$trainingId/finish"
                  params={{ trainingId: training.id }}
                >
                  Dokončit trénink
                </Link>
              </Button>
            )}
          </>
        )
      }
    />
  )
}
