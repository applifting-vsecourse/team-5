import { DOG_COLOR_CLASSES } from "@/lib/dogColors"
import { cn } from "@/lib/utils"

export { DOG_COLOR_CLASSES }

const SIZE_CLASSES = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-xl", // 56px per Figma node 51-386
  xl: "size-16 text-2xl",
} as const

export type PesAvatarProps = {
  name: string
  color: number
  size?: keyof typeof SIZE_CLASSES
  className?: string
}

export function PesAvatar({ name, color, size = "md", className }: PesAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "P"
  const colorClass = DOG_COLOR_CLASSES[color] ?? "bg-dog-1"
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md

  return (
    <div
      role="img"
      aria-label={`Avatar psa ${name}`}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-white select-none",
        colorClass,
        sizeClass,
        className,
      )}
    >
      {initial}
    </div>
  )
}
