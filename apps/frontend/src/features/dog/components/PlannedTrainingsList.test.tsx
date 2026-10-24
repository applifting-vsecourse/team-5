import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { dogKeys } from "@/features/dog/api/dogKeys"
import type { PlannedTraining } from "@/features/dog/api/dogSchemas"

import { PlannedTrainingsList } from "./PlannedTrainingsList"

// Seed the cache so the list renders without hitting the API.
const renderList = (trainings: PlannedTraining[]) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  queryClient.setQueryData(dogKeys.plannedTrainings("d1"), trainings)
  render(
    <QueryClientProvider client={queryClient}>
      <PlannedTrainingsList
        dogId="d1"
        dogName="Rex"
      />
    </QueryClientProvider>,
  )
}

describe("PlannedTrainingsList (#74)", () => {
  it("shows the day each training is planned for", () => {
    renderList([
      { id: "t1", date: "2026-10-27", goal: { id: "g1", title: "Chůze u nohy" } },
      { id: "t2", date: "2026-10-29", goal: { id: "g2", title: "Pac" } },
    ])

    const items = screen.getAllByRole("listitem")
    expect(items[0]).toHaveTextContent("Chůze u nohy")
    expect(items[0]).toHaveTextContent("úterý 27. 10.")
    expect(items[1]).toHaveTextContent("Pac")
    expect(items[1]).toHaveTextContent("čtvrtek 29. 10.")
  })

  it("says when nothing is planned", () => {
    renderList([])

    expect(screen.getByText("Rex teď nemá naplánovaný žádný trénink.")).toBeInTheDocument()
  })
})
