import { useEffect, useRef, useState, type FormEvent } from "react"
import { Camera, Check, Plus, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { validateDogPhoto } from "@/lib/dogPhoto"
import { cn } from "@/lib/utils"

import { updateDogInputSchema, type Dog } from "@/features/dog/api/dogSchemas"
import { useUpdateDog } from "@/features/dog/hooks/useUpdateDog"

import { DEFAULT_DISCIPLINES, DOG_COLORS } from "./CreateDogDialog"
import { PesAvatar } from "./PesAvatar"

type EditDogFormProps = {
  dog: Dog
  onClose: () => void
  onSuccess?: (dog: Dog) => void
}

function EditDogForm({ dog, onClose, onSuccess }: EditDogFormProps) {
  const [name, setName] = useState(dog.name)
  const [breed, setBreed] = useState(dog.breed ?? "")
  const [color, setColor] = useState<number>(dog.color)
  const [disciplines, setDisciplines] = useState<string[]>(dog.disciplines ?? [])
  const [customDiscipline, setCustomDiscipline] = useState("")
  const [customDisciplineError, setCustomDisciplineError] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ name?: string; breed?: string }>({})

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isPhotoRemoved, setIsPhotoRemoved] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(dog.photoUrl ?? null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const updateDogMutation = useUpdateDog(dog.id)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateDogPhoto(file)
    if (validationError) {
      setPhotoError(validationError)
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    setPhotoError(null)
    setPhotoFile(file)
    setIsPhotoRemoved(false)
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleRemovePhoto = () => {
    setPhotoFile(null)
    setIsPhotoRemoved(true)
    setPhotoError(null)
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleAddCustomDiscipline = () => {
    const trimmed = customDiscipline.trim()
    if (!trimmed) return

    if (trimmed.length > 40) {
      setCustomDisciplineError("Název disciplíny může mít maximálně 40 znaků")
      return
    }

    const isDuplicate = disciplines.some((d) => d.toLowerCase() === trimmed.toLowerCase())
    if (isDuplicate) {
      setCustomDisciplineError("Tato disciplína je již vybrána")
      return
    }

    setDisciplines((prev) => [...prev, trimmed])
    setCustomDiscipline("")
    setCustomDisciplineError(null)
  }

  const handleToggleDefaultDiscipline = (disc: string) => {
    setDisciplines((prev) => {
      const isSelected = prev.some((d) => d.toLowerCase() === disc.toLowerCase())
      if (isSelected) {
        return prev.filter((d) => d.toLowerCase() !== disc.toLowerCase())
      }
      return [...prev, disc]
    })
  }

  const handleRemoveDiscipline = (disc: string) => {
    setDisciplines((prev) => prev.filter((d) => d !== disc))
  }

  const customDisciplines = disciplines.filter(
    (d) => !DEFAULT_DISCIPLINES.some((def) => def.toLowerCase() === d.toLowerCase()),
  )

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const parseResult = updateDogInputSchema.safeParse({
      name,
      breed,
      color,
      disciplines,
      photo: photoFile,
      removePhoto: isPhotoRemoved,
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
    updateDogMutation.mutate(parseResult.data, {
      onSuccess: (updatedDog) => {
        onClose()
        onSuccess?.(updatedDog)
      },
    })
  }

  const isPending = updateDogMutation.isPending

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Upravit psa</DialogTitle>
        <DialogDescription>
          Upravte profil svého psa pro plánování tréninků a kalendář.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {/* Fotka psa */}
        <div className="space-y-2">
          <Label>Fotka psa (volitelné)</Label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
              className="group relative cursor-pointer rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden"
              aria-label="Vybrat fotku psa"
            >
              <PesAvatar
                name={name || "Pes"}
                color={color}
                size="lg"
                photoUrl={previewUrl}
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <Camera className="size-5 text-white" />
              </div>
            </button>

            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPending}
                  className="min-h-11"
                >
                  <Camera className="size-4" />
                  <span>{previewUrl ? "Změnit fotku" : "Nahrát fotku"}</span>
                </Button>
                {previewUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemovePhoto}
                    disabled={isPending}
                    className="min-h-11 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                    <span>Odstranit fotku</span>
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">JPG, PNG nebo HEIC do 10 MB</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/heic,.jpg,.jpeg,.png,.heic"
            capture="environment"
            className="sr-only"
            onChange={handlePhotoChange}
            disabled={isPending}
            data-testid="edit-dog-photo-input"
          />

          {photoError && <p className="text-xs text-destructive">{photoError}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-dog-name">Jméno psa *</Label>
          <Input
            id="edit-dog-name"
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
          <Label htmlFor="edit-dog-breed">Plemeno</Label>
          <Input
            id="edit-dog-breed"
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
          <Label id="edit-dog-color-label">Barva pro kalendář</Label>
          <div
            role="radiogroup"
            aria-labelledby="edit-dog-color-label"
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

        <div className="space-y-2">
          <Label>Sporty a disciplíny (volitelné)</Label>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_DISCIPLINES.map((disc) => {
              const isSelected = disciplines.some((d) => d.toLowerCase() === disc.toLowerCase())
              return (
                <button
                  key={disc}
                  type="button"
                  role="checkbox"
                  aria-checked={isSelected}
                  onClick={() => handleToggleDefaultDiscipline(disc)}
                  disabled={isPending}
                  className={cn(
                    "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                  )}
                >
                  {isSelected && <Check className="size-3.5" />}
                  <span>{disc}</span>
                </button>
              )
            })}
          </div>

          {customDisciplines.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {customDisciplines.map((disc) => (
                <span
                  key={disc}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-primary bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                >
                  <span>{disc}</span>
                  <button
                    type="button"
                    aria-label={`Odebrat disciplínu ${disc}`}
                    onClick={() => handleRemoveDiscipline(disc)}
                    disabled={isPending}
                    className="relative ml-1 inline-flex size-6 items-center justify-center rounded-full text-primary-foreground after:absolute after:-inset-2 hover:bg-black/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Input
              aria-label="Název vlastní disciplíny"
              placeholder="Vlastní disciplína..."
              maxLength={40}
              value={customDiscipline}
              onChange={(e) => {
                setCustomDiscipline(e.target.value)
                if (customDisciplineError) setCustomDisciplineError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddCustomDiscipline()
                }
              }}
              disabled={isPending}
              className="min-h-11 flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddCustomDiscipline}
              disabled={isPending || !customDiscipline.trim()}
              className="min-h-11"
            >
              <Plus className="size-4" />
              <span>Přidat</span>
            </Button>
          </div>
          {customDisciplineError && (
            <p className="text-xs text-destructive">{customDisciplineError}</p>
          )}
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isPending}
          className="min-h-11"
        >
          Zrušit
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="min-h-11"
        >
          {isPending ? "Ukládám..." : "Uložit změny"}
        </Button>
      </DialogFooter>
    </form>
  )
}

type EditDogDialogProps = {
  dog: Dog
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSuccess?: (dog: Dog) => void
}

export function EditDogDialog({ dog, isOpen, onOpenChange, onSuccess }: EditDogDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        {isOpen && (
          <EditDogForm
            dog={dog}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
