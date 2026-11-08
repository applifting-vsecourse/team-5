import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

import { HistoryView } from "@/features/dog/components/HistoryView"

export const Route = createFileRoute("/_ProtectedPages/history")({
  validateSearch: (search: Record<string, unknown>): { dogId?: string } => ({
    ...(typeof search.dogId === "string" && search.dogId ? { dogId: search.dogId } : {}),
  }),
  component: HistoryPage,
})
function HistoryPage() {
  const { dogId } = Route.useSearch()
  return (
    <>
      <Seo title="Historie" />
      <HistoryView
        key={dogId ?? "all"}
        initialDogId={dogId}
      />
    </>
  )
}
