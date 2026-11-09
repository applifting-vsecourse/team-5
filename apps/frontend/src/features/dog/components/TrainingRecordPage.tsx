import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { DesignIcon } from "@/components/DesignIcon"
import { QueryState } from "@/components/QueryState"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api-client"
import { conversationQueryOptions, type ConversationDetail } from "@/lib/conversations"
import { dogColorClass } from "@/lib/dogColors"
import { dogKeys } from "@/lib/dogKeys"
import { cn } from "@/lib/utils"

const ANSWER_LABELS = { YES: "Ano", PARTIALLY: "Částečně", NO: "Ne" } as const
const QUICK_REPLIES = ["👍 Díky!", "Zkusíme zítra", "Mám otázku"] as const

function SuccessRing({ rate }: { rate: number | null }) {
  const value = rate == null ? 0 : Math.max(0, Math.min(100, rate))
  const r = 42
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <div
      className="relative size-22 shrink-0"
      role="img"
      aria-label={rate == null ? "Bez hodnocení úspěšnosti" : `Úspěšnost ${rate} %`}
    >
      <svg
        viewBox="0 0 100 100"
        className="size-full -rotate-90"
        aria-hidden
      >
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          className="stroke-secondary"
          strokeWidth="10"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          className="stroke-primary"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={rate == null ? c : offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xl font-extrabold tabular-nums">
        {rate == null ? "—" : `${rate} %`}
      </span>
    </div>
  )
}

function RecordSummary({ detail }: { detail: ConversationDetail }) {
  const mistakes = detail.mistakeDetails?.length ? detail.mistakeDetails.join(", ") : null
  return (
    <section
      aria-labelledby="record-title"
      className="space-y-4 rounded-card border border-border bg-card p-4"
    >
      <div className="flex items-start gap-4">
        <SuccessRing rate={detail.successRate} />
        <div className="min-w-0 flex-1 space-y-2">
          <h2
            id="record-title"
            className="text-lg font-extrabold tracking-tight break-words"
          >
            {detail.title}
          </h2>
          {detail.goal?.title && (
            <p className="text-sm text-muted-foreground">{detail.goal.title}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {detail.status === "SKIPPED" ? (
              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-muted-foreground">
                Přeskočeno
              </span>
            ) : (
              <span className="rounded-full bg-success px-2.5 py-1 text-xs font-bold text-success-foreground">
                Hotovo
              </span>
            )}
          </div>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        {detail.focus && (
          <div className="min-w-0">
            <dt className="text-xs font-medium text-muted-foreground">Soustředění</dt>
            <dd className="text-sm font-bold">{ANSWER_LABELS[detail.focus]}</dd>
          </div>
        )}
        {detail.repeatedMistakes && (
          <div className="min-w-0">
            <dt className="text-xs font-medium text-muted-foreground">Opakoval chyby</dt>
            <dd className="text-sm font-bold">
              {ANSWER_LABELS[detail.repeatedMistakes]}
              {mistakes ? ` · ${mistakes}` : ""}
            </dd>
          </div>
        )}
      </dl>
      {detail.videoUrl?.startsWith("https://") && (
        <a
          href={detail.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-touch items-center gap-2 rounded-field border border-border px-3 text-sm font-bold text-primary"
        >
          <DesignIcon name="record-Link" />
          {detail.videoUrl.replace(/^https?:\/\//, "")}
        </a>
      )}
    </section>
  )
}

function ThreadComposer({
  activityId,
  currentUserId,
}: {
  activityId: string
  currentUserId?: string | null
}) {
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
  const messages = detail.data?.messages ?? []
  const replyRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (window.location.hash !== "#training-reply") return
    const frame = window.requestAnimationFrame(() => {
      replyRef.current?.scrollIntoView({ block: "end" })
      replyRef.current?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [activityId])
  return (
    <section
      aria-labelledby="record-thread"
      className="space-y-4 rounded-card border border-border bg-card p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="record-thread"
          className="text-section font-extrabold"
        >
          Vlákno s trenérem
        </h2>
        {messages.length > 0 && (
          <span className="text-sm font-bold text-primary">
            {messages.length}{" "}
            {messages.length === 1 ? "zpráva" : messages.length < 5 ? "zprávy" : "zpráv"}
          </span>
        )}
      </div>
      <ol
        className="flex flex-col gap-3"
        aria-label="Zprávy u tréninku"
      >
        {messages.map((message) => {
          const isMe = Boolean(currentUserId && message.author.id === currentUserId)
          return (
            <li
              key={message.id}
              className={cn(
                "max-w-[85%] space-y-1 rounded-field p-3",
                isMe
                  ? "ml-auto rounded-br-xs bg-accent text-accent-foreground"
                  : "mr-auto rounded-bl-xs border border-border bg-card text-card-foreground",
              )}
            >
              <p
                className={cn("text-xs font-bold", isMe ? "text-primary" : "text-muted-foreground")}
              >
                {isMe ? "Já" : message.author.name} · {message.createdAt.toLocaleString("cs-CZ")}
              </p>
              <p className="text-sm break-words whitespace-pre-wrap">{message.text}</p>
            </li>
          )
        })}
      </ol>
      {!messages.length && <p className="text-sm text-muted-foreground">Zatím žádná zpráva.</p>}
      <div className="flex flex-wrap gap-2">
        {QUICK_REPLIES.map((reply) => (
          <Button
            key={reply}
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full font-bold"
            onClick={() => setText(reply)}
          >
            {reply}
          </Button>
        ))}
      </div>
      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          if (text.trim() && !send.isPending) send.mutate()
        }}
      >
        <Textarea
          ref={replyRef}
          id="training-reply"
          aria-label="Napsat zprávu"
          placeholder="Napsat zprávu…"
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={2000}
          disabled={send.isPending}
          className="min-h-12 flex-1 resize-none scroll-mb-32"
        />
        <Button
          type="submit"
          size="icon"
          className="size-11 shrink-0 rounded-full"
          disabled={send.isPending || !text.trim()}
          aria-label={send.isPending ? "Odesílám" : "Odeslat zprávu"}
        >
          <DesignIcon name="record-Send" />
        </Button>
      </form>
    </section>
  )
}

export function TrainingRecordPage({
  dogId,
  activityId,
  currentUserId,
}: {
  dogId: string
  activityId: string
  currentUserId?: string | null
}) {
  const detail = useQuery(conversationQueryOptions(activityId))
  const recordDogId = detail.data?.dog.id
  const hasDogMismatch = Boolean(recordDogId && recordDogId !== dogId)
  const backDogId = recordDogId ?? dogId

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back()
    } else {
      window.location.assign(`/dogs/${backDogId}/activities`)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <header className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleBack}
          aria-label="Zpět"
          className="shrink-0 rounded-field bg-card"
        >
          <DesignIcon name="record-ChevL" />
        </Button>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Záznam tréninku</h1>
          {detail.data && !hasDogMismatch && (
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <span
                aria-hidden
                className={cn("size-2 rounded-full", dogColorClass(detail.data.dog.color))}
              />
              {detail.data.dog.name} · {detail.data.completedAt.toLocaleString("cs-CZ")}
            </p>
          )}
        </div>
      </header>
      <QueryState
        isLoading={detail.isLoading}
        error={detail.error ?? (hasDogMismatch ? new Error("Záznam nepatří k tomuto psovi") : null)}
        onRetry={() => void detail.refetch()}
        empty={null}
      >
        {detail.data && !hasDogMismatch && (
          <>
            <RecordSummary detail={detail.data} />
            <ThreadComposer
              activityId={activityId}
              currentUserId={currentUserId}
            />
          </>
        )}
      </QueryState>
    </div>
  )
}
