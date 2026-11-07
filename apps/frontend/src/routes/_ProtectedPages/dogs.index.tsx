import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

import { archivedDogsQueryOptions, dogsQueryOptions } from "@/features/dog/api/dogsQueryOptions"
import { DogList } from "@/features/dog/components/DogList"

function dogCountLabel(count: number): string {
  if (count === 1) return "1 pes"
  if (count >= 2 && count <= 4) return `${count} psi`
  return `${count} psů`
}

export const Route = createFileRoute("/_ProtectedPages/dogs/")({
  component: DogsPage,
})

function DogsPage() {
  const dogsQuery = useQuery(dogsQueryOptions())
  const archivedQuery = useQuery(archivedDogsQueryOptions())
  const dogs = dogsQuery.data ?? []
  // Ignore active dogs if a generic /dogs mock also answered ?archived=true.
  const archivedDogs = (archivedQuery.data ?? []).filter((dog) => dog.isArchived)

  return (
    <>
      <Seo title="Psi" />
      <section className="mx-auto w-full max-w-2xl px-gutter pt-4 pb-6 md:py-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-page font-extrabold tracking-tight text-foreground">Moji psi</h1>
            {!dogsQuery.isLoading ? (
              <p className="text-xs font-semibold text-muted-foreground">
                {dogCountLabel(dogs.length)}
                {archivedDogs.length ? ` · ${archivedDogs.length} v archivu` : ""}
                {dogs.some((dog) => dog.trainers?.length)
                  ? ` · Sdílení: ${[...new Set(dogs.flatMap((dog) => dog.trainers?.map((trainer) => trainer.name) ?? []))].join(", ")}`
                  : ""}
              </p>
            ) : null}
          </div>
        </header>

        <DogList
          dogs={dogs}
          archivedDogs={archivedDogs}
          isLoading={dogsQuery.isLoading}
          error={dogsQuery.error}
          onReload={() => {
            void dogsQuery.refetch()
            void archivedQuery.refetch()
          }}
        />
      </section>
    </>
  )
}
