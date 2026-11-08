import type { ComponentProps } from "react"

import { DesignIcon } from "@/components/DesignIcon"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function IconInput({
  icon,
  className,
  ...props
}: ComponentProps<typeof Input> & { icon: string }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
        <DesignIcon name={icon} />
      </span>
      <Input
        {...props}
        className={cn("pl-11", className)}
      />
    </div>
  )
}
