import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

import { dogsQueryOptions } from "@/features/dog/api/dogsQueryOptions"
import { CreateDogDialog } from "@/features/dog/components/CreateDogDialog"
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
  const dogs = dogsQuery.data ?? []

  return (
    <>
      <Seo title="Psi" />
      <section className="mx-auto w-full max-w-2xl px-4 py-6 md:py-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-page font-extrabold tracking-tight text-foreground">Moji psi</h1>
            {!dogsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">{dogCountLabel(dogs.length)}</p>
            ) : null}
          </div>

          <CreateDogDialog existingDogs={dogs} />
        </header>

        <DogList
          dogs={dogs}
          isLoading={dogsQuery.isLoading}
          error={dogsQuery.error}
          onReload={() => void dogsQuery.refetch()}
        />
      </section>
    </>
  )
}
