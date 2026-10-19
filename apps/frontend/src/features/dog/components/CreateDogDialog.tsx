import { useCallback, useMemo, useState, type FormEvent, type ReactNode } from "react"
import { Check, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

import { createDogInputSchema, type Dog } from "@/features/dog/api/dogSchemas"
import { useCreateDog } from "@/features/dog/hooks/useCreateDog"

export const DOG_COLORS = [
  { value: 1, label: "Barva 1", className: "bg-dog-1" },
  { value: 2, label: "Barva 2", className: "bg-dog-2" },
  { value: 3, label: "Barva 3", className: "bg-dog-3" },
  { value: 4, label: "Barva 4", className: "bg-dog-4" },
  { value: 5, label: "Barva 5", className: "bg-dog-5" },
  { value: 6, label: "Barva 6", className: "bg-dog-6" },
] as const

export function getFirstUnusedColor(existingDogs?: { color: number }[]): number {
  if (!existingDogs || existingDogs.length === 0) return 1
  const used = new Set(existingDogs.map((d) => d.color))
  for (let c = 1; c <= 6; c++) {
    if (!used.has(c)) return c
  }
  return 1
}

type CreateDogDialogProps = {
  existingDogs?: Dog[]
  isOpen?: boolean
  onOpenChange?: (isOpen: boolean) => void
  onSuccess?: (dog: Dog) => void
  trigger?: ReactNode
}

export function CreateDogDialog({
  existingDogs,
  isOpen: isControlledOpen,
  onOpenChange: onControlledOpenChange,
  onSuccess,
  trigger,
}: CreateDogDialogProps) {
  const [isInternalOpen, setIsInternalOpen] = useState(false)
  const isControlled = isControlledOpen !== undefined
  const isOpen = isControlled ? isControlledOpen : isInternalOpen

  const defaultColor = useMemo(() => getFirstUnusedColor(existingDogs), [existingDogs])

  const [name, setName] = useState("")
  const [breed, setBreed] = useState("")
  const [color, setColor] = useState<number>(defaultColor)
  const [errors, setErrors] = useState<{ name?: string; breed?: string }>({})

  const resetForm = useCallback(() => {
    setName("")
    setBreed("")
    setColor(defaultColor)
    setErrors({})
  }, [defaultColor])

  const handleOpenChange = useCallback(
    (isNextOpen: boolean) => {
      if (isNextOpen) {
        resetForm()
      }
      if (isControlled) {
        onControlledOpenChange?.(isNextOpen)
      } else {
        setIsInternalOpen(isNextOpen)
      }
    },
    [isControlled, onControlledOpenChange, resetForm],
  )

  const createDogMutation = useCreateDog()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const parseResult = createDogInputSchema.safeParse({
      name,
      breed,
      color,
    })

    if (!parseResult.success) {
      const fieldErrors: { name?: string; breed?: string } = {}
      for (const issue of parseResult.error.issues) {
        if (issue.path[0] === "name") {
          fieldErrors.name = issue.message
        } else if (issue.path[0] === "breed") {
          fieldErrors.breed = issue.message
        }
      }
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    createDogMutation.mutate(parseResult.data, {
      onSuccess: (newDog) => {
        handleOpenChange(false)
        onSuccess?.(newDog)
      },
    })
  }

  const isPending = createDogMutation.isPending

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      {trigger !== undefined ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button aria-label="Přidat psa">
            <Plus className="size-4" />
            <span>Nový pes</span>
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nový pes</DialogTitle>
            <DialogDescription>
              Vyplňte profil svého psa pro plánování tréninků a kalendář.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dog-name">Jméno psa *</Label>
              <Input
                id="dog-name"
                name="name"
                placeholder="např. Rex"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
                }}
                maxLength={40}
                aria-invalid={Boolean(errors.name)}
                disabled={isPending}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dog-breed">Plemeno</Label>
              <Input
                id="dog-breed"
                name="breed"
                placeholder="např. Border kolie (volitelné)"
                value={breed}
                onChange={(e) => {
                  setBreed(e.target.value)
                  if (errors.breed) setErrors((prev) => ({ ...prev, breed: undefined }))
                }}
                maxLength={100}
                aria-invalid={Boolean(errors.breed)}
                disabled={isPending}
              />
              {errors.breed && <p className="text-xs text-destructive">{errors.breed}</p>}
            </div>

            <div className="space-y-2">
              <Label id="dog-color-label">Barva pro kalendář</Label>
              <div
                role="radiogroup"
                aria-labelledby="dog-color-label"
                className="flex flex-wrap items-center gap-3"
              >
                {DOG_COLORS.map((c) => {
                  const isSelected = color === c.value
                  return (
                    <button
                      key={c.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={c.label}
                      onClick={() => setColor(c.value)}
                      disabled={isPending}
                      className={cn(
                        "flex size-11 items-center justify-center rounded-full transition-transform focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden active:scale-95",
                        c.className,
                        isSelected
                          ? "scale-105 ring-2 ring-foreground ring-offset-2"
                          : "opacity-90 hover:scale-105 hover:opacity-100",
                      )}
                    >
                      {isSelected && <Check className="size-5 stroke-[3] text-white" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Zrušit
            </Button>
            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending ? "Ukládám..." : "Vytvořit psa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
