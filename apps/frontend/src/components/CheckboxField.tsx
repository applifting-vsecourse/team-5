import type { ReactNode } from "react"

import { Checkbox } from "@/components/ui/checkbox"
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
  isDisabled = false,
  className,
  name,
}: CheckboxFieldProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex min-h-touch items-center gap-3",
        isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className,
      )}
    >
      <Checkbox
        id={id}
        name={name}
        checked={isChecked}
        disabled={isDisabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <span className="text-sm leading-snug font-medium text-foreground">{label}</span>
    </label>
  )
}
