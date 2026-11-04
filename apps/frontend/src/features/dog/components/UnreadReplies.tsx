import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { unreadRepliesQueryOptions, type UnreadReply } from "@/lib/trainingReplies"

import { TrainingPlanReplyDialog, TrainingRecordDialog } from "./TrainingRecordDialog"

// This list deliberately spans weeks: the navigation dot must always lead to
// the unread record, even when its training happened last month.
export function UnreadReplies() {
  const query = useQuery(unreadRepliesQueryOptions())
  const [selected, setSelected] = useState<UnreadReply | null>(null)
  const byRecord = new Map<string, UnreadReply>()
  for (const reply of query.data ?? []) {
    const key = reply.workoutLog
      ? `record:${reply.workoutLog.id}`
      : `plan:${reply.scheduledTraining?.id}`
    if (!byRecord.has(key)) byRecord.set(key, reply)
  }
  return (
    <section
      className="space-y-3"
      aria-labelledby="unread-replies-heading"
    >
      <h2
        id="unread-replies-heading"
        className="text-lg font-semibold tracking-tight"
      >
        Nové odpovědi
      </h2>
      {query.isLoading ? (
        <p
          role="status"
          className="text-sm text-muted-foreground"
        >
          Načítání odpovědí…
        </p>
      ) : query.isError ? (
        <div
          role="alert"
          className="space-y-2"
        >
          <p className="text-sm text-muted-foreground">Odpovědi se nepodařilo načíst.</p>
          <Button
            variant="outline"
            className="min-h-12"
            onClick={() => void query.refetch()}
          >
            Načíst odpovědi znovu
          </Button>
        </div>
      ) : byRecord.size === 0 ? (
        <p className="text-sm text-muted-foreground">Nemáte žádné nepřečtené odpovědi.</p>
      ) : (
        <ul className="space-y-2">
          {[...byRecord].map(([key, reply]) => {
            const dog = reply.workoutLog?.dog ?? reply.scheduledTraining?.dog
            const title = reply.workoutLog?.title ?? reply.scheduledTraining?.goal.title
            return (
              <li key={key}>
                <button
                  type="button"
                  aria-label={`${dog?.name} · ${title}, nová odpověď`}
                  className="flex min-h-12 w-full flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-left focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => setSelected(reply)}
                >
                  <span>
                    {dog?.name} · {title}
                  </span>
                  <Badge variant="secondary">nová odpověď</Badge>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {selected?.workoutLog && (
        <TrainingRecordDialog
          key={selected.workoutLog.id}
          dogId={selected.workoutLog.dog.id}
          dogName={selected.workoutLog.dog.name}
          activityId={selected.workoutLog.id}
          onClose={() => setSelected(null)}
        />
      )}
      {selected && !selected.workoutLog && selected.scheduledTraining && (
        <TrainingPlanReplyDialog
          key={selected.scheduledTraining.id}
          trainingId={selected.scheduledTraining.id}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  )
}
