import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import type { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api-client"
import { replyKeys } from "@/lib/trainingReplies"

import { dogKeys } from "@/features/dog/api/dogKeys"
import type { DogActivity } from "@/features/dog/api/dogSchemas"
import {
  trainingPlanReplyQueryOptions,
  trainingRecordQueryOptions,
  type currentPlanSchema,
} from "@/features/dog/api/replyQueries"
import { useReadTrainingReplies } from "@/features/dog/hooks/useReadTrainingReplies"

function ReadFailure({ retry, isPending }: { retry: () => void; isPending: boolean }) {
  return (
    <div
      role="alert"
      className="space-y-2"
    >
      <p className="text-sm text-muted-foreground">Odpověď se nepodařilo označit jako přečtenou.</p>
      <Button
        variant="outline"
        className="min-h-12"
        disabled={isPending}
        onClick={retry}
      >
        Zkusit znovu
      </Button>
    </div>
  )
}

function CurrentPlan({ plan }: { plan: z.infer<typeof currentPlanSchema> }) {
  return (
    <section
      className="space-y-3"
      aria-label="Aktuální plán"
    >
      <h3 className="text-lg font-semibold tracking-tight">Aktuální plán · {plan.title}</h3>
      {plan.principle && <p className="text-sm whitespace-pre-wrap">{plan.principle}</p>}
      {plan.blocks.length ? (
        <ol className="space-y-3">
          {plan.blocks.map((block, index) => (
            <li
              key={block.id}
              className="space-y-1"
            >
              <p className="font-medium">
                {index + 1}. {block.title}
              </p>
              {block.instruction && (
                <p className="text-sm whitespace-pre-wrap">{block.instruction}</p>
              )}
              {block.criterion && (
                <p className="text-sm text-muted-foreground">Kritérium: {block.criterion}</p>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">Plán zatím nemá žádný cvik.</p>
      )}
    </section>
  )
}

function RecordContent({ activity }: { activity: DogActivity }) {
  return (
    <>
      <p className="text-sm text-muted-foreground">
        {activity.status === "completed" ? "Odcvičeno" : "Přeskočeno"}
        {activity.completedAt ? ` · ${activity.completedAt.toLocaleDateString("cs-CZ")}` : ""}
      </p>
      {activity.successRate != null && <p>Úspěšnost: {activity.successRate} %</p>}
      {activity.rating != null && <p>Hodnocení: {activity.rating} / 5</p>}
      {activity.note && <p className="text-sm whitespace-pre-wrap">{activity.note}</p>}
      {activity.videoUrl && (
        <a
          className="inline-flex min-h-12 items-center underline"
          href={activity.videoUrl}
          target="_blank"
          rel="noreferrer"
        >
          Video z tréninku
        </a>
      )}
      <section
        className="space-y-3"
        aria-label="Zprávy u tréninku"
      >
        <h3 className="text-lg font-semibold tracking-tight">Zprávy u tréninku</h3>
        {activity.messages?.length ? (
          <ol className="space-y-4">
            {activity.messages.map((message) => (
              <li
                key={message.id}
                className="space-y-1"
              >
                <p className="text-sm font-medium">{message.author.name}</p>
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">Zde se zobrazí zprávy k tomuto tréninku.</p>
        )}
      </section>
    </>
  )
}

function MessageForm({ dogId, activityId }: { dogId: string; activityId: string }) {
  const [text, setText] = useState("")
  const [validationError, setValidationError] = useState("")
  const queryClient = useQueryClient()
  const send = useMutation({
    mutationFn: (message: string) =>
      api.post(`dogs/${dogId}/activities/${activityId}/messages`, { json: { text: message } }),
    onSuccess: () => {
      setText("")
      void queryClient.invalidateQueries({ queryKey: replyKeys.record(dogId, activityId) })
      void queryClient.invalidateQueries({ queryKey: dogKeys.activities(dogId) })
      void queryClient.invalidateQueries({ queryKey: replyKeys.unread })
    },
  })
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        const message = text.trim()
        if (!message || message.length > 2000) {
          setValidationError(message ? "Zpráva může mít nejvýš 2000 znaků." : "Napište zprávu.")
          return
        }
        setValidationError("")
        send.mutate(message)
      }}
    >
      <Label htmlFor="training-reply-text">Zpráva k tréninku</Label>
      <Textarea
        id="training-reply-text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        disabled={send.isPending}
        aria-invalid={Boolean(validationError)}
        aria-describedby={validationError ? "training-reply-error" : undefined}
      />
      {validationError && (
        <p
          id="training-reply-error"
          className="text-sm text-destructive"
          role="alert"
        >
          {validationError}
        </p>
      )}
      {send.isError && (
        <p
          className="text-sm text-destructive"
          role="alert"
        >
          Zprávu se nepodařilo odeslat. Zkuste to znovu.
        </p>
      )}
      <Button
        type="submit"
        className="min-h-12"
        disabled={send.isPending}
      >
        {send.isPending ? "Odesílám…" : "Odeslat zprávu"}
      </Button>
    </form>
  )
}

export function TrainingRecordDialog({
  dogId,
  activityId,
  dogName,
  onClose,
  initialActivity,
}: {
  dogId: string
  activityId: string
  dogName: string
  onClose: () => void
  initialActivity?: DogActivity
}) {
  const query = useQuery({
    ...trainingRecordQueryOptions(dogId, activityId),
    enabled: Boolean(dogId && activityId) && !initialActivity,
  })
  const record = query.data
  const read = useReadTrainingReplies(
    query.isSuccess && query.isFetchedAfterMount && !query.isFetching
      ? record?.unreadReplyIds
      : undefined,
  )
  const activity = initialActivity ?? record
  return (
    <Dialog
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{activity?.title ?? "Záznam tréninku"}</DialogTitle>
          <DialogDescription>Detail tréninkového záznamu pro psa {dogName}.</DialogDescription>
        </DialogHeader>
        {query.isError && !initialActivity ? (
          <div
            role="alert"
            className="space-y-3"
          >
            <p>Záznam se nepodařilo načíst.</p>
            <Button
              variant="outline"
              className="min-h-12"
              onClick={() => void query.refetch()}
            >
              Zkusit znovu
            </Button>
          </div>
        ) : activity ? (
          <div className="space-y-4">
            <RecordContent activity={activity} />
            {record?.planChanged && <p className="text-sm font-medium">Trenér upravil plán.</p>}
            {record?.goal && <CurrentPlan plan={record.goal} />}
            {read.isError && (
              <ReadFailure
                retry={read.retry}
                isPending={read.isPending}
              />
            )}
            {record && (
              <MessageForm
                dogId={dogId}
                activityId={activityId}
              />
            )}
            {record?.goalId && !record.isOwner && (
              <Button
                asChild
                variant="outline"
                className="min-h-12"
              >
                <Link
                  to="/dogs/$dogId/goals/$goalId"
                  params={{ dogId, goalId: record.goalId }}
                  search={{ replyToActivityId: activityId }}
                >
                  Upravit plán
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <p role="status">Načítání záznamu…</p>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function TrainingPlanReplyDialog({
  trainingId,
  onClose,
}: {
  trainingId: string
  onClose: () => void
}) {
  const query = useQuery(trainingPlanReplyQueryOptions(trainingId))
  const read = useReadTrainingReplies(
    query.isSuccess && query.isFetchedAfterMount && !query.isFetching
      ? query.data?.unreadReplyIds
      : undefined,
  )
  return (
    <Dialog
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Změna plánu</DialogTitle>
          <DialogDescription>
            {query.data?.dog.name ?? "Trénink"} · Trenér upravil další postup.
          </DialogDescription>
        </DialogHeader>
        {query.isError ? (
          <div
            role="alert"
            className="space-y-3"
          >
            <p>Plán se nepodařilo načíst.</p>
            <Button
              variant="outline"
              className="min-h-12"
              onClick={() => void query.refetch()}
            >
              Zkusit znovu
            </Button>
          </div>
        ) : query.data ? (
          <CurrentPlan plan={query.data.goal} />
        ) : (
          <p role="status">Načítání plánu…</p>
        )}
        {read.isError && (
          <ReadFailure
            retry={read.retry}
            isPending={read.isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
