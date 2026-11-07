import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { QueryState } from "@/components/QueryState"
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
import { conversationQueryOptions } from "@/lib/conversations"
import { dogKeys } from "@/lib/dogKeys"

const ANSWER_LABELS = { YES: "Ano", PARTIALLY: "Částečně", NO: "Ne" } as const

function Thread({ activityId }: { activityId: string }) {
  const client = useQueryClient()
  const detail = useQuery(conversationQueryOptions(activityId))
  const [text, setText] = useState("")
  const send = useMutation({
    mutationFn: () =>
      api.post(`activities/${activityId}/messages`, { json: { text: text.trim() } }),
    onSuccess: async () => {
      setText("")
      await Promise.all([
        client.invalidateQueries({ queryKey: ["training-conversation", activityId] }),
        client.invalidateQueries({ queryKey: ["training-updates"] }),
        client.invalidateQueries({ queryKey: dogKeys.all }),
      ])
    },
    onError: () => toast.error("Zprávu se nepodařilo odeslat. Text zůstal rozepsaný."),
  })
  return (
    <QueryState
      isLoading={detail.isLoading}
      error={detail.error}
      onRetry={() => void detail.refetch()}
      empty={null}
    >
      {detail.data && (
        <div className="space-y-5">
          <div>
            <h3 className="font-bold">
              {detail.data.dog.name} · {detail.data.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {detail.data.completedAt.toLocaleDateString("cs-CZ")}
              {detail.data.successRate != null ? ` · ${detail.data.successRate} %` : ""}
            </p>
          </div>
          {detail.data.note && (
            <p className="rounded-field bg-secondary p-3 text-sm whitespace-pre-wrap">
              {detail.data.note}
            </p>
          )}
          {detail.data.focus && (
            <p className="text-sm">
              <strong>Soustředění:</strong> {ANSWER_LABELS[detail.data.focus]}
            </p>
          )}
          {detail.data.repeatedMistakes && (
            <p className="text-sm">
              <strong>Opakované chyby:</strong> {ANSWER_LABELS[detail.data.repeatedMistakes]}
            </p>
          )}
          {detail.data.videoUrl?.startsWith("https://") && (
            <a
              href={detail.data.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-touch items-center text-sm font-bold text-primary underline"
            >
              Otevřít video ↗
            </a>
          )}
          {Boolean(detail.data.mistakeDetails?.length) && (
            <p className="text-sm">
              <strong>Které chyby:</strong> {detail.data.mistakeDetails?.join(", ")}
            </p>
          )}
          <ol
            className="space-y-3"
            aria-label="Zprávy u tréninku"
          >
            {detail.data.messages.map((message) => (
              <li
                key={message.id}
                className="space-y-1 rounded-field bg-accent p-3"
              >
                <p className="text-xs font-bold">
                  {message.author.name} · {message.createdAt.toLocaleString("cs-CZ")}
                </p>
                <p className="text-sm break-words whitespace-pre-wrap">{message.text}</p>
              </li>
            ))}
          </ol>
          {!detail.data.messages.length && (
            <p className="text-sm text-muted-foreground">Zatím žádná zpráva.</p>
          )}
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              if (text.trim() && !send.isPending) send.mutate()
            }}
          >
            <Label htmlFor="training-reply">Odpověď</Label>
            <Textarea
              id="training-reply"
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={2000}
              disabled={send.isPending}
              className="min-h-24"
            />
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={send.isPending || !text.trim()}
            >
              {send.isPending ? "Odesílám…" : "Odeslat zprávu"}
            </Button>
          </form>
        </div>
      )}
    </QueryState>
  )
}

export function TrainingConversationDialog({
  activityId,
  onClose,
}: {
  activityId: string | null
  onClose: () => void
}) {
  return (
    <Dialog
      open={activityId != null}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto bg-background sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Zprávy u tréninku</DialogTitle>
          <DialogDescription>Konverzace psovoda a sdílených trenérů.</DialogDescription>
        </DialogHeader>
        {activityId && (
          <Thread
            key={activityId}
            activityId={activityId}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
