import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_ProtectedPages/dogs/$dogId")({
  component: DogDetailPage,
})

function DogDetailPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Detail psa</h1>
    </div>
  )
}
