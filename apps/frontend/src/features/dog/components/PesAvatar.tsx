import { cn } from "@/lib/utils"

export const DOG_COLOR_CLASSES: Record<number, string> = {
  1: "bg-dog-1",
  2: "bg-dog-2",
  3: "bg-dog-3",
  4: "bg-dog-4",
  5: "bg-dog-5",
  6: "bg-dog-6",
}

const SIZE_CLASSES = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-xl", // 56px per Figma node 51-386
  xl: "size-16 text-2xl",
} as const

type PesAvatarProps = {
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
