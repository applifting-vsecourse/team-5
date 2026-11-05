import { PawPrint } from "lucide-react"

import { EmptyState } from "@/components/EmptyState"
import { QueryState } from "@/components/QueryState"
import { Button } from "@/components/ui/button"

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
  return (
    <QueryState
      isLoading={isLoading}
      error={error}
      isEmpty={dogs.length === 0}
      onRetry={onReload}
      loadingLabel="Načítám seznam psů"
      errorTitle="Chyba při načítání psů"
      errorDescription="Nepodařilo se načíst seznam psů."
      empty={
        <EmptyState
          icon={PawPrint}
          chip="BEZ PSA"
          iconTone="dog"
          title="Přidejte prvního psa"
          description="Po přidání psa k němu budete moci vést plán, tréninky a kalendář."
          action={
            <CreateDogDialog
              existingDogs={dogs}
              trigger={
                <Button
                  size="lg"
                  className="w-full"
                >
                  <PawPrint className="size-4" />
                  <span>Přidat psa</span>
                </Button>
              }
            />
          }
        />
      }
    >
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
    </QueryState>
  )
}
