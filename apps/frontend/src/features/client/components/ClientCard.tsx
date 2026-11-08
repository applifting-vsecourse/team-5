import { Link } from "@tanstack/react-router"
import { ChevronRight, Clock } from "lucide-react"

import { dogColorClass } from "@/lib/dogColors"
import { cn } from "@/lib/utils"

import type { Client } from "@/features/client/api/clientSchemas"

export type ClientListExtras = {
  successRate: number | null
  lastActivity: string
  attentionLabel: string | null
  attentionKind: "reply" | "inactive" | "low-success" | null
}

type ClientCardProps = {
  client: Client
  extras?: ClientListExtras | null
}

export function ClientCard({ client, extras }: ClientCardProps) {
  const dogs = client.dogs.slice(0, 4)
  const badge =
    extras?.attentionKind === "inactive" && extras.attentionLabel ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-warning px-2.5 py-0.5 text-xs font-extrabold text-warning-foreground">
        <Clock
          className="size-3"
          aria-hidden
        />
        {extras.attentionLabel
          .replace(/^Bez tréninku\s+/i, "")
          .replace(/^Zatím bez tréninku ·\s*/i, "")}
      </span>
    ) : extras?.attentionKind === "low-success" && extras.successRate != null ? (
      <span className="rounded-full bg-danger-surface px-2.5 py-0.5 text-xs font-extrabold text-danger-foreground">
        {Math.round(extras.successRate)} %
      </span>
    ) : extras?.successRate != null ? (
      <span className="rounded-full bg-success px-2.5 py-0.5 text-xs font-extrabold text-success-foreground">
        {Math.round(extras.successRate)} %
      </span>
    ) : (
      <span className="text-sm font-extrabold text-muted-foreground">—</span>
    )

  return (
    <li>
      <Link
        to="/clients/$clientId"
        params={{ clientId: client.id }}
        className="flex min-h-touch items-center gap-3 rounded-card border border-border bg-card p-3 outline-hidden transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-hero text-sm font-extrabold text-hero-foreground"
        >
          {client.name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join("") || "?"}
        </span>
        <span className="min-w-0 flex-1 space-y-1">
          <span className="block truncate text-sm font-bold">{client.name}</span>
          <span className="flex flex-wrap items-center gap-1.5">
            {dogs.length ? (
              dogs.map((dog) => (
                <span
                  key={dog.id}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold"
                >
                  <span
                    aria-hidden
                    className={cn("size-1.5 rounded-full", dogColorClass(dog.color))}
                  />
                  {dog.name}
                </span>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">Bez sdíleného psa</span>
            )}
          </span>
          {extras?.lastActivity && (
            <span className="block truncate text-xs font-medium text-muted-foreground">
              {extras.lastActivity}
            </span>
          )}
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          {badge}
          <ChevronRight
            className="size-4 text-muted-foreground"
            aria-hidden
          />
        </span>
      </Link>
    </li>
  )
}
