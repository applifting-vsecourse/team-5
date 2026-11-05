import type { ReactNode } from "react"

import { dogColorClass } from "@/lib/dogColors"
import { cn } from "@/lib/utils"

type StripCardProps = {
  children: ReactNode
  /** Dog colour index 1–6 from Dog.color; omit for a neutral card without strip. */
  dogColor?: number
  className?: string
  as?: "article" | "div" | "li"
}

/**
 * Card with an optional dog-colour identity strip (calendar row, client row).
 * Callers: DogCard.tsx (migrate strip), week cards in #161, docs/ui-components.md.
 * Reads dogColor index only — no API/schema writes. No existing shared StripCard
 * (DogCard inlines the pattern). User: "vem si nejaky redesign issue z baclogu
 * tohohle sprintu a zacni na nem delat".
 */
export function StripCard({ children, dogColor, className, as: Comp = "article" }: StripCardProps) {
  return (
    <Comp
      data-slot="strip-card"
      className={cn(
        "relative flex flex-row items-stretch overflow-hidden rounded-item border border-border bg-card text-card-foreground",
        className,
      )}
    >
      {dogColor != null ? (
        <div
          aria-hidden
          className={cn("w-1.5 shrink-0 self-stretch", dogColorClass(dogColor))}
        />
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </Comp>
  )
}
