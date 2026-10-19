import { AlertCircle, PawPrint } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import type { Dog } from "@/features/dog/api/dogSchemas"

import { CreateDogDialog } from "./CreateDogDialog"
import { DogCard } from "./DogCard"

type DogListProps = {
  dogs: Dog[]
  isLoading?: boolean
  error?: Error | null
  onReload?: () => void
}

export function DogList({ dogs, isLoading = false, error = null, onReload }: DogListProps) {
  if (isLoading) {
    return (
      <div
        className="flex flex-col gap-3"
        aria-label="Načítám seznam psů"
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex min-h-16 items-center gap-4 rounded-lg border border-border p-4"
          >
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="size-5 rounded-md" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Chyba při načítání psů</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          <span>{error.message || "Nepodařilo se načíst seznam psů."}</span>
          {onReload && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onReload}
            >
              Zkusit znovu
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  if (dogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center sm:p-12">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <PawPrint className="size-6" />
        </div>

        <h2 className="mb-1 text-lg font-semibold tracking-tight text-foreground">
          Přidejte prvního psa
        </h2>
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          Po přidání psa k němu budete moci vést plán, tréninky a kalendář.
        </p>

        <CreateDogDialog
          existingDogs={dogs}
          trigger={
            <Button>
              <PawPrint className="size-4" />
              <span>Přidat psa</span>
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div
      className="flex flex-col gap-3"
      aria-label="Seznam psů"
    >
      {dogs.map((dog) => (
        <DogCard
          key={dog.id}
          dog={dog}
        />
      ))}
    </div>
  )
}
