import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { ChevronLeft, Link2, Send } from "lucide-react"
import { toast } from "sonner"

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
      className="relative size-24 shrink-0"
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
            className="text-title font-extrabold tracking-tight break-words"
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
                {detail.goal?.blocks.length
                  ? `${detail.goal.blocks.filter((block) => block.outcome === "MASTERED" || block.outcome === "SKIPPED").length} ze ${detail.goal.blocks.length} kroků`
                  : "Hotovo"}
              </span>
            )}
          </div>
        </div>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        {detail.focus && (
          <div className="rounded-field bg-secondary p-3">
            <dt className="text-xs font-medium text-muted-foreground">Soustředění</dt>
            <dd className="text-sm font-bold">{ANSWER_LABELS[detail.focus]}</dd>
          </div>
        )}
        {detail.repeatedMistakes && (
          <div className="rounded-field bg-secondary p-3">
            <dt className="text-xs font-medium text-muted-foreground">Opakoval chyby</dt>
            <dd className="text-sm font-bold">
              {ANSWER_LABELS[detail.repeatedMistakes]}
              {mistakes ? ` · ${mistakes}` : ""}
            </dd>
          </div>
        )}
      </dl>
      {detail.note && (
        <p className="rounded-field bg-secondary p-3 text-sm whitespace-pre-wrap">{detail.note}</p>
      )}
      {detail.videoUrl?.startsWith("https://") && (
        <a
          href={detail.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-touch items-center gap-2 rounded-field border border-border px-3 text-sm font-bold text-primary"
        >
          <Link2
            className="size-4"
            aria-hidden
          />
          {detail.videoUrl.replace(/^https?:\/\//, "")}
        </a>
      )}
    </section>
  )
}

function StepsList({
  blocks,
  isCompleted,
}: {
  blocks: NonNullable<ConversationDetail["goal"]>["blocks"]
  isCompleted: boolean
}) {
  if (!blocks.length) return null
  return (
    <section
      aria-labelledby="record-steps"
      className="space-y-3"
    >
      <h2
        id="record-steps"
        className="text-section font-extrabold"
      >
        Kroky
      </h2>
      <ol className="space-y-2">
        {blocks.map((block) => {
          const isDone = isCompleted || block.outcome === "MASTERED" || block.outcome === "SKIPPED"
          const label =
            block.outcome === "SKIPPED" ? "přeskočeno" : isDone ? "hotovo" : "bez výsledku"
          return (
            <li
              key={block.id}
              className="flex min-h-touch items-center gap-3 rounded-card border border-border bg-card px-3 py-2"
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  isDone
                    ? "bg-success text-success-foreground"
                    : "bg-secondary text-muted-foreground",
                )}
                aria-hidden
              >
                {isDone ? "✓" : block.position + 1}
              </span>
              <span className="min-w-0 flex-1 text-sm font-bold break-words">{block.title}</span>
              <span className="shrink-0 text-xs font-semibold text-muted-foreground">{label}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function ThreadComposer({ activityId }: { activityId: string }) {
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
  return (
    <section
      aria-labelledby="record-thread"
      className="space-y-4"
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
        className="space-y-3"
        aria-label="Zprávy u tréninku"
      >
        {messages.map((message) => (
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
      {!messages.length && <p className="text-sm text-muted-foreground">Zatím žádná zpráva.</p>}
      <div className="flex flex-wrap gap-2">
        {QUICK_REPLIES.map((reply) => (
          <Button
            key={reply}
            type="button"
            variant="secondary"
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
          id="training-reply"
          aria-label="Napsat zprávu"
          placeholder="Napsat zprávu…"
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={2000}
          disabled={send.isPending}
          className="min-h-12 flex-1 resize-none"
        />
        <Button
          type="submit"
          size="icon"
          className="size-11 shrink-0 rounded-full"
          disabled={send.isPending || !text.trim()}
          aria-label={send.isPending ? "Odesílám" : "Odeslat zprávu"}
        >
          <Send className="size-4" />
        </Button>
      </form>
    </section>
  )
}

export function TrainingRecordPage({ dogId, activityId }: { dogId: string; activityId: string }) {
  const detail = useQuery(conversationQueryOptions(activityId))
  const recordDogId = detail.data?.dog.id
  const hasDogMismatch = Boolean(recordDogId && recordDogId !== dogId)
  const backDogId = recordDogId ?? dogId
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 pb-8">
      <header className="space-y-3">
        <nav aria-label="Navigace zpět">
          <Link
            to="/dogs/$dogId/activities"
            params={{ dogId: backDogId }}
            className="inline-flex min-h-touch items-center gap-1.5 text-sm font-medium text-muted-foreground outline-hidden hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft
              className="size-5"
              aria-hidden
            />
            Historie
          </Link>
        </nav>
        <div>
          <h1 className="text-page font-extrabold tracking-tight">Záznam tréninku</h1>
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
            {detail.data.goal?.blocks.length ? (
              <StepsList
                blocks={detail.data.goal.blocks}
                isCompleted={detail.data.status === "COMPLETED"}
              />
            ) : null}
            <ThreadComposer activityId={activityId} />
          </>
        )}
      </QueryState>
    </div>
  )
}
