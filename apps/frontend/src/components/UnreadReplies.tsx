import { useEffect, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { MessageCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { api } from "@/lib/api-client"
import { replyDog, replyRecordId, unreadRepliesOptions } from "@/lib/trainingReplies"

export function UnreadBadge() {
  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-info px-2.5 py-1 text-xs font-bold text-info-foreground">
      <MessageCircle
        className="size-3"
        aria-hidden
      />
      nová odpověď
    </span>
  )
}
export function RecordUnreadBadge({
  activityId,
  scheduledId,
  dogIds,
  hasUnread,
}: {
  activityId?: string
  scheduledId?: string
  dogIds?: string[]
  /** When provided by a parent that already loaded unread replies, skips a per-card query. */
  hasUnread?: boolean
}) {
  const query = useQuery({
    ...unreadRepliesOptions(),
    enabled: hasUnread === undefined,
  })
  if (query.isError) return null
  const shouldShow =
    hasUnread ??
    (query.data ?? []).some(
      (reply) =>
        (activityId !== undefined && replyRecordId(reply) === activityId) ||
        (scheduledId !== undefined && reply.scheduledTraining?.id === scheduledId) ||
        (dogIds?.includes(replyDog(reply)?.id ?? "") ?? false),
    )
  return shouldShow ? <UnreadBadge /> : null
}
export function UnreadNavDot() {
  const { data = [], isError } = useQuery(unreadRepliesOptions())
  if (isError || data.length === 0) return null
  return (
    <span className="inline-flex items-center">
      <span
        aria-hidden
        className="size-2 rounded-full bg-current"
      />
      <span className="sr-only">Nové odpovědi</span>
    </span>
  )
}

// The IDs come from the loaded content snapshot, never a later global query.
export function ReadReplyReceipt({ ids }: { ids: string[] }) {
  const client = useQueryClient()
  const attempted = useRef("")
  const key = [...ids].sort().join(",")
  const { mutate, isError, isPending } = useMutation({
    mutationFn: async (snapshot: string[]) => {
      for (let i = 0; i < snapshot.length; i += 500) {
        await api.post("training-replies/read", { json: { ids: snapshot.slice(i, i + 500) } })
      }
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ["unread-training-replies"] }),
  })
  useEffect(() => {
    if (key && attempted.current !== key) {
      attempted.current = key
      mutate(key.split(","))
    }
  }, [key, mutate])
  return isError ? (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
    >
      Odpověď se nepodařilo označit jako přečtenou.
      <Button
        variant="outline"
        disabled={isPending}
        onClick={() => mutate(ids)}
      >
        Zkusit znovu
      </Button>
    </div>
  ) : null
}

export function UnreadReplyList({ dogIds }: { dogIds?: string[] }) {
  const query = useQuery(unreadRepliesOptions())
  const replies = (query.data ?? []).filter(
    (reply) => !dogIds || dogIds.includes(replyDog(reply)?.id ?? ""),
  )
  const unique = [
    ...new Map(
      replies.map((reply) => [replyRecordId(reply) ?? reply.scheduledTraining?.id, reply]),
    ).values(),
  ]
  if (query.isLoading) {
    return (
      <p
        role="status"
        className="text-sm text-muted-foreground"
      >
        Načítám nové odpovědi…
      </p>
    )
  }
  if (query.isError) {
    return (
      <div
        role="alert"
        className="text-sm"
      >
        Nové odpovědi se nepodařilo načíst.{" "}
        <Button
          variant="outline"
          onClick={() => void query.refetch()}
        >
          Zkusit znovu
        </Button>
      </div>
    )
  }
  if (!unique.length) return null
  return (
    <section
      aria-label="Nové odpovědi"
      className="space-y-3 rounded-card border border-border bg-card p-4"
    >
      <div>
        <h2 className="text-lg font-extrabold">
          Nové odpovědi <span className="text-muted-foreground">({unique.length})</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Zprávy a změny plánu ze všech týdnů. Otevřením je označíte jako přečtené.
        </p>
      </div>
      <ul className="divide-y divide-border">
        {unique.map((reply) => {
          const dog = replyDog(reply)!
          const activityId = replyRecordId(reply)
          const text = (
            <>
              <span className="min-w-0 flex-1">
                <span className="block font-bold break-words">
                  {dog.name} · {reply.workoutLog?.title ?? reply.scheduledTraining?.training.title}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {reply.kind === "PLAN_CHANGED" ? "Trenér změnil plán" : "Nová zpráva"} ·{" "}
                  {reply.createdAt.toLocaleDateString("cs-CZ")}
                </span>
              </span>
              <UnreadBadge />
            </>
          )
          return (
            <li key={reply.id}>
              {activityId ? (
                <Link
                  className="flex min-h-touch flex-wrap items-center gap-2 rounded-md py-3 text-sm"
                  to="/dogs/$dogId/activities/$activityId"
                  params={{ dogId: dog.id, activityId }}
                >
                  {text}
                </Link>
              ) : (
                <Link
                  className="flex min-h-touch flex-wrap items-center gap-2 rounded-md py-3 text-sm"
                  to="/trainings/$trainingId"
                  params={{ trainingId: reply.scheduledTraining!.id }}
                >
                  {text}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
