import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

import { HistoryView } from "@/features/dog/components/HistoryView"

export const Route = createFileRoute("/_ProtectedPages/dogs/$dogId/activities")({
  component: DogHistoryPage,
})
function DogHistoryPage() {
  const { dogId } = Route.useParams()
  return (
    <>
      <Seo title="Historie" />
      <HistoryView initialDogId={dogId} />
    </>
  )
}
