import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { formatDistanceToNow } from "date-fns"
import { cs } from "date-fns/locale"
import { MessageSquare } from "lucide-react"

import { EmptyState } from "@/components/EmptyState"
import { QueryState } from "@/components/QueryState"
import { updatesQueryOptions } from "@/lib/conversations"
import { dogColorClass } from "@/lib/dogColors"

export function InboxView() {
  const query = useQuery(updatesQueryOptions())

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-page font-extrabold tracking-tight">Zprávy</h1>
          <p className="text-xs text-muted-foreground">
            Centrální přehled konverzací a komentářů z tréninků
          </p>
        </div>
      </header>

      <QueryState
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        empty={null}
        errorTitle="Zprávy se nepodařilo načíst"
      >
        {query.data && query.data.length > 0 ? (
          <ul
            className="space-y-3"
            aria-label="Seznam zpráv"
          >
            {query.data.map((item) => {
              const time = formatDistanceToNow(item.createdAt, {
                locale: cs,
                addSuffix: true,
              })

              return (
                <li key={item.id}>
                  <Link
                    to="/dogs/$dogId/activities/$activityId"
                    params={{
                      dogId: item.activity.dog.id,
                      activityId: item.workoutLogId,
                    }}
                    className="flex min-h-touch flex-col items-stretch gap-2 rounded-card border border-border bg-card p-4 text-left transition-colors hover:bg-card/90 focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Otevřít záznam tréninku ${item.activity.title} pro psa ${item.activity.dog.name}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className={`size-2.5 shrink-0 rounded-full ${dogColorClass(item.activity.dog.color)}`}
                        />
                        <span className="text-xs font-bold text-muted-foreground">
                          {item.activity.dog.name} · {item.activity.title}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{time}</span>
                    </div>

                    <div className="flex items-start gap-3 pt-1">
                      <span
                        aria-hidden
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-hero text-xs font-extrabold text-hero-foreground"
                      >
                        {item.author.name.trim().charAt(0)}
                      </span>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-xs font-bold text-primary">{item.author.name}</p>
                        <p className="line-clamp-2 text-sm leading-relaxed break-words whitespace-pre-wrap text-foreground">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <EmptyState
            icon={MessageSquare}
            title="Žádné zprávy"
            description="Zatím nemáte žádné komentáře ani zprávy u tréninků."
          />
        )}
      </QueryState>
    </div>
  )
}
