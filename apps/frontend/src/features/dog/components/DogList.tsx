import { PawPrint } from "lucide-react"

import { DesignIcon } from "@/components/DesignIcon"
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
    <div className="space-y-6">
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
          />
        }
      >
        <div
          className="flex flex-col gap-6"
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
      {!isLoading && !error && (
        <CreateDogDialog
          existingDogs={dogs}
          trigger={
            <Button
              type="button"
              variant="outline"
              aria-label="Přidat psa"
              className="flex h-auto w-full flex-col gap-3 rounded-hero border-2 border-dashed bg-background px-5 py-6 whitespace-normal"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-accent">
                <DesignIcon name="dogs-Plus1" />
              </span>
              <span className="text-lg font-extrabold">Přidat psa</span>
              <span className="max-w-xs text-center text-sm font-normal text-muted-foreground">
                Jméno, plemeno, disciplíny a barva – zabere to minutu.
              </span>
            </Button>
          }
        />
      )}
    </div>
  )
}
