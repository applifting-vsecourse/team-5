import { useState } from "react"

import { DOG_COLOR_CLASSES, DOG_RING_CLASSES } from "@/lib/dogColors"
import { resolvePhotoUrl } from "@/lib/dogPhoto"
import { cn } from "@/lib/utils"

export { DOG_COLOR_CLASSES, DOG_RING_CLASSES }

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
  photoUrl?: string | null
  className?: string
}

export function PesAvatar({ name, color, size = "md", photoUrl, className }: PesAvatarProps) {
  const [erroredPhotoUrl, setErroredPhotoUrl] = useState<string | null>(null)

  const initial = name.trim().charAt(0).toUpperCase() || "P"
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md
  const resolvedUrl = resolvePhotoUrl(photoUrl)
  const isPhotoValid = Boolean(resolvedUrl && erroredPhotoUrl !== photoUrl)

  if (resolvedUrl && isPhotoValid) {
    const ringClass = DOG_RING_CLASSES[color] ?? "ring-dog-1"
    return (
      <div
        role="img"
        aria-label={`Avatar psa ${name}`}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full overflow-hidden select-none ring-2 ring-offset-1 ring-offset-background",
          ringClass,
          sizeClass,
          className,
        )}
      >
        <img
          src={resolvedUrl}
          alt={name}
          className="size-full object-cover rounded-full"
          onError={() => setErroredPhotoUrl(photoUrl)}
        />
      </div>
    )
  }

  const colorClass = DOG_COLOR_CLASSES[color] ?? "bg-dog-1"

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
