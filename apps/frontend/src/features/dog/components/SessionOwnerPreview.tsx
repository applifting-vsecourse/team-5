import { DesignIcon } from "@/components/DesignIcon"
import { EditorIcon } from "@/components/EditorIcon"
import { Button } from "@/components/ui/button"
import { dogColorClass } from "@/lib/dogColors"
import { cn } from "@/lib/utils"

import type { Dog, DogGoal, PlanBlock } from "@/features/dog/api/dogSchemas"
import type { TrainingSession } from "@/features/dog/api/trainingEditor"

type SessionOwnerPreviewProps = {
  dog: Pick<Dog, "name" | "color">
  goal: Pick<DogGoal, "title" | "discipline">
  session: Pick<TrainingSession, "title">
  sessionIndex: number
  sessionsTotal: number
  /** Steps in walkthrough order (sub-steps before their parent), as on Dnes. */
  steps: PlanBlock[]
  onStart: () => void
}

/**
 * Desktop live preview (Figma 132:1579): the owner's Dnes card for this
 * training, built like `NextTrainingHero` — dog colour, the same meta line and
 * steps in walkthrough order. Začít trénink opens the same walkthrough the owner
 * gets on mobile (#162), without saving progress.
 */
export function SessionOwnerPreview({
  dog,
  goal,
  session,
  sessionIndex,
  sessionsTotal,
  steps,
  onStart,
}: SessionOwnerPreviewProps) {
  const meta = [goal.discipline, session.title !== goal.title ? goal.title : null]
    .filter(Boolean)
    .join(" › ")

  return (
    <aside
      aria-label="Náhled pro psovoda"
      className="flex flex-col gap-3 rounded-card bg-secondary p-4"
    >
      <div className="flex items-center gap-2 text-label font-bold text-muted-foreground">
        <EditorIcon name="Eye1" />
        <span>Takhle to uvidí psovod</span>
      </div>
      <div className="flex flex-col gap-3 rounded-sheet border-4 border-border bg-background p-3.5">
        <section
          aria-label="Dnešní trénink v náhledu"
          className={cn(
            "flex flex-col gap-3 rounded-hero p-4 text-dog-foreground",
            dogColorClass(dog.color),
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-extrabold text-primary-foreground uppercase">
              Dnešní trénink
            </span>
            <span className="rounded-full bg-dog-foreground/15 px-2.5 py-1 text-xs font-semibold">
              {dog.name}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-lg leading-tight font-extrabold tracking-tight break-words">
              {session.title}
            </p>
            <p className="text-xs font-medium">
              {meta}
              {meta ? " · " : ""}
              trénink {sessionIndex}/{sessionsTotal}
            </p>
          </div>
          {steps.length > 0 ? (
            <ol className="flex flex-col gap-1.5">
              {steps.map((step, index) => (
                <li
                  key={step.id}
                  className="flex max-w-full items-start gap-2 rounded-full bg-dog-foreground/15 py-1 pr-3 pl-1 text-xs font-semibold"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-dog-foreground/25 text-xs font-extrabold">
                    {index + 1}
                  </span>
                  <span className="min-w-0 break-words">{step.title}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-xs">Plán zatím nemá žádný cvik.</p>
          )}
          <Button
            type="button"
            className="w-full font-bold"
            onClick={onStart}
          >
            <DesignIcon name="today-Play" />
            Začít trénink
          </Button>
        </section>
        <div className="flex items-start gap-2 rounded-field bg-accent p-2.5 text-xs font-medium">
          <EditorIcon name="Target" />
          <p>Kritérium „Hotovo, když…“ se zobrazí u každého kroku zvlášť.</p>
        </div>
      </div>
    </aside>
  )
}
