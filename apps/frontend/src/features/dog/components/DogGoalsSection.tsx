import { useState } from "react"
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

import type { DogGoal } from "@/features/dog/api/dogSchemas"

const DEFAULT_GOALS: DogGoal[] = [
  {
    id: "g1",
    title: "Spolehlivá chůze u nohy",
    category: "Poslušnost",
    status: "active",
  },
  {
    id: "g2",
    title: "Odložení za pohybu",
    category: "Poslušnost",
    status: "active",
  },
  {
    id: "g3",
    title: "Přivolání s rušením",
    category: "Každodenní dovednosti",
    status: "active",
  },
]

type DogGoalsSectionProps = {
  dogName: string
}

export function DogGoalsSection({ dogName }: DogGoalsSectionProps) {
  const [goals, setGoals] = useState<DogGoal[]>(DEFAULT_GOALS)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newGoalTitle, setNewGoalTitle] = useState("")

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGoalTitle.trim()) return

    const newGoal: DogGoal = {
      id: `g-${Date.now()}`,
      title: newGoalTitle.trim(),
      category: "Individuální plán",
      status: "active",
    }
    setGoals((prev) => [newGoal, ...prev])
    setNewGoalTitle("")
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

      {goals.length === 0 ? (
        <p className="text-sm text-muted-foreground">Zatím nebyly nastaveny žádné aktivní cíle.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {goals.map((goal) => (
            <Card
              key={goal.id}
              className="flex min-h-11 items-center justify-between gap-3 border border-border p-3 transition-colors hover:border-foreground/30"
            >
              <div className="min-w-0">
                <span className="truncate text-sm font-medium text-foreground">{goal.title}</span>
                {goal.category && (
                  <span className="ml-2 text-xs text-muted-foreground">({goal.category})</span>
                )}
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Card>
          ))}
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
                  maxLength={60}
                  required
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
              <Button type="submit">Přidat cíl</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}
