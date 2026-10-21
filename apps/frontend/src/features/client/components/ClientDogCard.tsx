import { Link } from "@tanstack/react-router"
import { ChevronRight } from "lucide-react"

import { DOG_COLOR_CLASSES, PesAvatar } from "@/components/PesAvatar"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import type { ClientDog } from "@/features/client/api/clientSchemas"

type ClientDogCardProps = {
  dog: ClientDog
  className?: string
}

export function ClientDogCard({ dog, className }: ClientDogCardProps) {
  const colorClass = DOG_COLOR_CLASSES[dog.color] ?? "bg-dog-1"
  const subtitle = [dog.breed, dog.disciplines?.join(", ")].filter(Boolean).join(" · ")

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
          />

          <div className="min-w-0 truncate">
            <h3 className="truncate text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
              {dog.name}
            </h3>
            {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>

        <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
      </Link>
    </Card>
  )
}
