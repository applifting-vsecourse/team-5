import { Link } from "@tanstack/react-router"
import { ChevronRight } from "lucide-react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import type { Dog } from "@/features/dog/api/dogSchemas"

import { DOG_COLOR_CLASSES, PesAvatar } from "./PesAvatar"

type DogCardProps = {
  dog: Dog
  className?: string
}

export function DogCard({ dog, className }: DogCardProps) {
  const colorClass = DOG_COLOR_CLASSES[dog.color] ?? "bg-dog-1"

  return (
    <Card
      className={cn(
        "group relative flex flex-row items-stretch gap-0 overflow-hidden border border-border p-0 transition-colors hover:border-foreground/30",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn("w-1.5 shrink-0 self-stretch", colorClass)}
      />

      <Link
        to="/dogs/$dogId"
        params={{ dogId: dog.id }}
        className="flex min-h-16 flex-1 items-center justify-between gap-4 p-4 text-left outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`Detail psa ${dog.name}`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <PesAvatar
            name={dog.name}
            color={dog.color}
            size="md"
            photoUrl={dog.photoUrl}
          />

          <div className="min-w-0 truncate">
            <h2 className="truncate text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
              {dog.name}
            </h2>
            {dog.breed && <p className="truncate text-sm text-muted-foreground">{dog.breed}</p>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="hidden items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-2.5 py-0.5 text-xs font-medium text-secondary-foreground select-none sm:inline-flex"
          >
            <span className={cn("size-2 rounded-full", colorClass)} />
            <span className="font-mono text-[11px]">Známka #{dog.color}</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
        </div>
      </Link>
    </Card>
  )
}
