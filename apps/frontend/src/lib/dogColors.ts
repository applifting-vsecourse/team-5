// Dog colours are data, not decoration (DESIGN.md): each dog has one of six,
// used to tell dogs apart on the avatar, in the week and on training cards.
// Shared here because more than one feature shows them.
export const DOG_COLOR_CLASSES: Record<number, string> = {
  1: "bg-dog-1",
  2: "bg-dog-2",
  3: "bg-dog-3",
  4: "bg-dog-4",
  5: "bg-dog-5",
  6: "bg-dog-6",
}

export const DOG_RING_CLASSES: Record<number, string> = {
  1: "ring-dog-1",
  2: "ring-dog-2",
  3: "ring-dog-3",
  4: "ring-dog-4",
  5: "ring-dog-5",
  6: "ring-dog-6",
}

export const dogColorClass = (color: number): string => DOG_COLOR_CLASSES[color] ?? "bg-dog-1"
export const dogRingClass = (color: number): string => DOG_RING_CLASSES[color] ?? "ring-dog-1"
