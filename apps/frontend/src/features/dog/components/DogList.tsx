// Callers: dogs.index. Existing DogList. Soft-archive Dog.isArchived (#57).
// User: "zpracuj stories 57,69 a 87 nad soucasnym dev"
import { Link } from "@tanstack/react-router"
import { Archive, PawPrint } from "lucide-react"

import { DesignIcon } from "@/components/DesignIcon"
import { EmptyState } from "@/components/EmptyState"
import { PesAvatar } from "@/components/PesAvatar"
import { QueryState } from "@/components/QueryState"
import { Button } from "@/components/ui/button"
import { dogColorClass } from "@/lib/dogColors"
import { cn } from "@/lib/utils"

import type { Dog } from "@/features/dog/api/dogSchemas"
import { useRestoreDog } from "@/features/dog/hooks/useUpdateDog"

import { CreateDogDialog } from "./CreateDogDialog"
import { DogCard } from "./DogCard"

type DogListProps = {
  dogs: Dog[]
  archivedDogs?: Dog[]
  isLoading?: boolean
  error?: Error | null
  onReload?: () => void
}

function ArchivedDogRow({ dog }: { dog: Dog }) {
  const restore = useRestoreDog(dog.id)
  return (
    <li className="flex items-center gap-3 rounded-card border border-border bg-card p-3">
      <Link
        to="/dogs/$dogId"
        params={{ dogId: dog.id }}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <PesAvatar
          name={dog.name}
          color={dog.color}
          photoUrl={dog.photoUrl}
          className={cn("size-11", dogColorClass(dog.color))}
        />
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold">{dog.name}</span>
          <span className="block text-xs text-muted-foreground">Archiv · historie zůstává</span>
        </span>
      </Link>
      <Button
        type="button"
        variant="outline"
        disabled={restore.isPending}
        onClick={() => restore.mutate()}
      >
        Vrátit
      </Button>
    </li>
  )
}

export function DogList({
  dogs,
  archivedDogs = [],
  isLoading = false,
  error = null,
  onReload,
}: DogListProps) {
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
      {archivedDogs.length > 0 && (
        <section
          className="space-y-3"
          aria-labelledby="dogs-archive-heading"
        >
          <div className="flex items-center gap-2">
            <Archive className="size-4 text-muted-foreground" />
            <h2
              id="dogs-archive-heading"
              className="text-sm font-extrabold"
            >
              Archiv
            </h2>
          </div>
          <ul className="space-y-2">
            {archivedDogs.map((dog) => (
              <ArchivedDogRow
                key={dog.id}
                dog={dog}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
