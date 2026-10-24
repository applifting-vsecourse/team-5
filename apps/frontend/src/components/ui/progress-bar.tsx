import * as React from "react"

import { cn } from "@/lib/utils"

export type ProgressBarProps = React.ComponentProps<"div"> & {
  value: number
  max?: number
  indicatorClassName?: string
}

export function ProgressBar({
  value,
  max = 100,
  className,
  indicatorClassName,
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(Math.max(0, Math.round((value / max) * 100)), 100)

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      <div
        className={cn(
          "h-full rounded-full bg-primary transition-all duration-300 ease-out",
          indicatorClassName,
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
