import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

import { dogsQueryOptions } from "@/features/dog/api/dogsQueryOptions"
import { CreateDogDialog } from "@/features/dog/components/CreateDogDialog"
import { DogList } from "@/features/dog/components/DogList"

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
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Psi</h1>
            <p className="text-sm text-muted-foreground">
              Správa psů a jejich tréninkových profilů
            </p>
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
