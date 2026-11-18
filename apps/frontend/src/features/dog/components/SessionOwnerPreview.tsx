import { Play } from "lucide-react"

import { EditorIcon } from "@/components/EditorIcon"

import type { Dog, PlanBlock } from "@/features/dog/api/dogSchemas"
import type { TrainingSession } from "@/features/dog/api/trainingEditor"

type SessionOwnerPreviewProps = {
  dog: Pick<Dog, "name">
  session: Pick<TrainingSession, "title">
  sessionIndex: number
  sessionsTotal: number
  steps: PlanBlock[]
  totalMinutes: number
}

function stepCountLabel(count: number): string {
  if (count === 1) return "1 krok"
  if (count >= 2 && count <= 4) return `${count} kroky`
  return `${count} kroků`
}

/** Desktop live preview of how the session looks on the owner's Today card (Figma 132:1579). */
export function SessionOwnerPreview({
  dog,
  session,
  sessionIndex,
  sessionsTotal,
  steps,
  totalMinutes,
}: SessionOwnerPreviewProps) {
  return (
    <aside
      aria-label="Náhled pro psovoda"
      className="flex flex-col gap-3 rounded-card bg-secondary p-4"
    >
      <div className="flex items-center gap-2 text-label font-bold text-muted-foreground">
        <EditorIcon name="Eye1" />
        <span>Takhle to uvidí psovod</span>
      </div>
      <div
        aria-hidden
        className="flex flex-col gap-3 rounded-[1.75rem] border-4 border-border bg-background p-3.5"
      >
        <p className="text-xs font-semibold text-muted-foreground">{dog.name}</p>
        <p className="text-section font-extrabold tracking-tight">Náhled tréninku</p>
        <div className="flex flex-col gap-2.5 rounded-card bg-hero p-3.5 text-hero-foreground">
          <span className="w-fit rounded-full bg-primary px-2 py-0.5 text-[9px] font-extrabold uppercase">
            Dnešní trénink
          </span>
          <p className="text-[17px] leading-tight font-extrabold break-words">{session.title}</p>
          <p className="text-[11px] font-medium text-hero-muted">
            Trénink {sessionIndex} z {sessionsTotal} · {stepCountLabel(steps.length)} · cca{" "}
            {totalMinutes} min
          </p>
          {steps.length > 0 ? (
            <ol className="flex flex-col gap-1.5">
              {steps.map((step, index) => (
                <li
                  key={step.id}
                  className="flex items-center gap-1.5 rounded-full bg-hero-accent py-1 pr-2.5 pl-1.5 text-xs font-semibold"
                >
                  <span className="flex size-[18px] shrink-0 items-center justify-center rounded-md bg-hero-muted/30 text-[10px] font-extrabold">
                    {index + 1}
                  </span>
                  <span className="min-w-0 break-words">{step.title}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-xs text-hero-muted">Zatím bez kroků.</p>
          )}
          <div className="flex h-10 items-center justify-center gap-1.5 rounded-field bg-primary text-[13px] font-bold">
            <Play className="size-3.5" />
            Začít trénink
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-[14px] bg-accent p-2.5 text-[11px] font-medium">
          <EditorIcon name="Target" />
          <p>Kritérium „Hotovo, když…“ se zobrazí u každého kroku zvlášť.</p>
        </div>
      </div>
    </aside>
  )
}
