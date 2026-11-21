import { useState } from "react"
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

import type { TrainingDetail } from "@/features/training/api/trainingSchemas"

type TrainingWalkthroughProps = {
  training: TrainingDetail
}

type LocalStepOutcome = "MASTERED" | "SKIPPED"

export function TrainingWalkthrough({ training }: TrainingWalkthroughProps) {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [outcomes, setOutcomes] = useState<Record<string, LocalStepOutcome>>({})

  const exercises = training.exercises
  const totalExercises = exercises.length
  const currentExercise = exercises[currentIndex]
  const isFirstLocal = currentIndex === 0
  const isLastLocal = currentIndex === totalExercises - 1
  const isPlanned = training.status === "PLANNED" && training.canTrain !== false

  const stepsWithOutcomes = exercises.map((exercise) => ({
    ...exercise,
    outcome: outcomes[exercise.id] ?? null,
  }))

  const advanceWith = (outcome: LocalStepOutcome) => {
    if (!isPlanned || !currentExercise) return
    setOutcomes((prev) => ({ ...prev, [currentExercise.id]: outcome }))
    if (isLastLocal) {
      void navigate({ to: "/trainings/$trainingId/finish", params: { trainingId: training.id } })
      return
    }
    setCurrentIndex((prev) => Math.min(totalExercises - 1, prev + 1))
  }

  const goBack = () => {
    if (!isPlanned || isFirstLocal) return
    const previousIndex = Math.max(0, currentIndex - 1)
    const previousExercise = exercises[previousIndex]
    if (previousExercise) {
      setOutcomes((prev) => {
        const next = { ...prev }
        delete next[previousExercise.id]
        return next
      })
    }
    setCurrentIndex(previousIndex)
  }

  return (
    <TrainingStepScreen
      title={training.training?.title ?? training.goal.title}
      dog={training.dog}
      steps={stepsWithOutcomes}
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
            {training.canTrain === false
              ? "Náhled tréninku. Záznam a postup v průchodu ovládá psovod."
              : "Trénink je uzavřený. Kroky si můžeš prohlédnout bez změny postupu."}
          </p>
        ) : null
      }
      actions={
        isPlanned ? (
          <>
            <Button
              type="button"
              size="lg"
              onClick={() => advanceWith("MASTERED")}
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
                disabled={isFirstLocal}
                onClick={goBack}
              >
                Zpět o krok
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="bg-card"
                onClick={() => advanceWith("SKIPPED")}
              >
                <SkipForward />
                Přeskočit krok
              </Button>
            </div>
          </>
        ) : (
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
        )
      }
    />
  )
}
