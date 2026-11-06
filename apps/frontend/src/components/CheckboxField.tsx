import type { ReactNode } from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type CheckboxFieldProps = {
  id: string
  label: ReactNode
  isChecked: boolean
  onCheckedChange: (isChecked: boolean) => void
  isDisabled?: boolean
  className?: string
  name?: string
}

/**
 * Touch-sized labelled checkbox row (DESIGN.md). Keeps the control small;
 * the whole row is the ≥44 px target.
 */
export function CheckboxField({
  id,
  label,
  isChecked,
  onCheckedChange,
  isDisabled,
  className,
  name,
}: CheckboxFieldProps) {
  return (
    <div className={cn("flex min-h-touch items-center gap-3", className)}>
      <Checkbox
        id={id}
        name={name}
        checked={isChecked}
        disabled={isDisabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <Label
        htmlFor={id}
        className="cursor-pointer text-sm leading-snug font-medium text-foreground"
      >
        {label}
      </Label>
    </div>
  )
}
