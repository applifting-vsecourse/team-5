import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronRight, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

import type { DogGoal } from "@/features/dog/api/dogSchemas"
import { dogGoalsQueryOptions } from "@/features/dog/api/dogsQueryOptions"
import { useCreateGoal } from "@/features/dog/hooks/useCreateGoal"

type DogGoalsSectionProps = {
  dogId?: string
  dogName: string
  goals?: DogGoal[]
}

export function DogGoalsSection({ dogId, dogName, goals: initialGoals }: DogGoalsSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newGoalTitle, setNewGoalTitle] = useState("")
  const [newGoalDiscipline, setNewGoalDiscipline] = useState("")

  const goalsQuery = useQuery({
    ...dogGoalsQueryOptions(dogId ?? ""),
    enabled: Boolean(dogId) && initialGoals === undefined,
  })

  const createGoalMutation = useCreateGoal(dogId ?? "")

  const displayGoals = initialGoals ?? goalsQuery.data ?? []

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGoalTitle.trim()) return

    if (dogId) {
      await createGoalMutation.mutateAsync({
        title: newGoalTitle.trim(),
        discipline: newGoalDiscipline.trim() || undefined,
      })
    }
    setNewGoalTitle("")
    setNewGoalDiscipline("")
    setIsDialogOpen(false)
  }

  return (
    <section
      className="space-y-3"
      aria-labelledby="goals-heading"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2
            id="goals-heading"
            className="text-lg font-semibold tracking-tight text-foreground"
          >
            Aktivní cíle
          </h2>
          <p className="text-xs text-muted-foreground">Tréninkové milníky pro {dogName}</p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsDialogOpen(true)}
          className="min-h-11 min-w-11 gap-1.5"
          aria-label="Vytvořit nový cíl"
        >
          <Plus className="size-4" />
          <span>Nový cíl</span>
        </Button>
      </div>

      {goalsQuery.isLoading && !initialGoals ? (
        <div className="space-y-2">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ) : displayGoals.length === 0 ? (
        <p className="text-sm text-muted-foreground">Zatím nebyly nastaveny žádné aktivní cíle.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {displayGoals.map((goal) => {
            const disciplineLabel = goal.discipline ?? goal.category

            return (
              <Card
                key={goal.id}
                className="flex min-h-11 flex-row items-center justify-between gap-3 border border-border p-3 transition-colors hover:border-foreground/30"
              >
                <div className="min-w-0">
                  <span className="truncate text-sm font-medium text-foreground">{goal.title}</span>
                  {disciplineLabel && (
                    <span className="ml-2 text-xs text-muted-foreground">({disciplineLabel})</span>
                  )}
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Card>
            )
          })}
        </div>
      )}

      <Dialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleAddGoal}>
            <DialogHeader>
              <DialogTitle>Nový cíl</DialogTitle>
              <DialogDescription>
                Zadejte cíl, kterého má {dogName} v tréninku dosáhnout.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="goal-title">Název cíle *</Label>
                <Input
                  id="goal-title"
                  placeholder="např. Klidné čekání před vchodem"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal-discipline">Disciplína / kategorie (volitelné)</Label>
                <Input
                  id="goal-discipline"
                  placeholder="např. Poslušnost, Canicross"
                  value={newGoalDiscipline}
                  onChange={(e) => setNewGoalDiscipline(e.target.value)}
                  maxLength={60}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Zrušit
              </Button>
              <Button
                type="submit"
                disabled={createGoalMutation.isPending}
              >
                {createGoalMutation.isPending ? "Ukládání..." : "Přidat cíl"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}
