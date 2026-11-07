import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { cs } from "date-fns/locale"

import { DesignIcon } from "@/components/DesignIcon"
import { QueryState } from "@/components/QueryState"
import { TrainingConversationDialog } from "@/components/TrainingConversationDialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { updatesQueryOptions } from "@/lib/conversations"

export function useTrainingUpdates() {
  const query = useQuery(updatesQueryOptions())
  const [isOpen, setOpen] = useState(false)
  const [activityId, setActivityId] = useState<string | null>(null)
  const latest = query.data?.[0]
  const time = latest ? formatDistanceToNow(latest.createdAt, { locale: cs, addSuffix: true }) : ""
  const bell = (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="shrink-0 rounded-field bg-card"
      aria-label="Oznámení"
      onClick={() => setOpen(true)}
    >
      <DesignIcon name="today-Bell" />
    </Button>
  )
  const notifications = (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={setOpen}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle>Oznámení</DialogTitle>
            <DialogDescription>Posledních 30 zpráv z tvých tréninků.</DialogDescription>
          </DialogHeader>
          <QueryState
            isLoading={query.isLoading}
            error={query.error}
            onRetry={() => void query.refetch()}
            empty={null}
          >
            {query.data?.length ? (
              <ul className="space-y-2">
                {query.data.map((message) => (
                  <li key={message.id}>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto w-full flex-col items-start gap-1 px-3 py-3 text-left whitespace-normal"
                      onClick={() => {
                        setOpen(false)
                        setActivityId(message.workoutLogId)
                      }}
                    >
                      <span className="font-bold">
                        {message.author.name} · {message.activity.dog.name}
                      </span>
                      <span className="text-sm font-normal">{message.text}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Zatím žádné zprávy.</p>
            )}
          </QueryState>
        </DialogContent>
      </Dialog>
      <TrainingConversationDialog
        activityId={activityId}
        onClose={() => setActivityId(null)}
      />
    </>
  )
  const message = (
    <section
      className="space-y-3"
      aria-labelledby="trainer-message-heading"
    >
      <h2
        id="trainer-message-heading"
        className="text-section font-extrabold"
      >
        Zpráva od trenéra
      </h2>
      <QueryState
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        empty={null}
      >
        {latest ? (
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-hero font-extrabold text-hero-foreground"
            >
              {latest.author.name.trim().charAt(0)}
            </span>
            <div className="min-w-0 flex-1 space-y-1 rounded-card rounded-tl-none bg-accent p-4">
              <p className="text-xs font-bold text-primary">
                {latest.author.name} · trenér · {time}
              </p>
              <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                {latest.text}
              </p>
              <Button
                type="button"
                variant="link"
                className="min-h-touch px-0 font-bold"
                onClick={() => setActivityId(latest.workoutLogId)}
              >
                Odpovědět
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Zatím žádná zpráva od trenéra.</p>
        )}
      </QueryState>
    </section>
  )
  return { bell, notifications, message }
}
