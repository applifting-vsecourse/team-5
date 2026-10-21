import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { dogKeys } from "@/features/dog/api/dogKeys"
import type { PlanBlock } from "@/features/dog/api/dogSchemas"

import { PlanBlocksSection } from "./PlanBlocksSection"

const aBlock = (overrides: Partial<PlanBlock> = {}): PlanBlock => ({
  id: "b1",
  goalId: "g1",
  position: 0,
  title: "Sedni u nohy",
  instruction: "Pes sedí u levé nohy, odměna z levé ruky.",
  criterion: "Sedí 5 s, i když kolem letí míček.",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// Seed the cache so the section renders without hitting the API.
const renderWithBlocks = (blocks: PlanBlock[]) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  queryClient.setQueryData(dogKeys.goalBlocks("g1"), blocks)
  return render(
    <QueryClientProvider client={queryClient}>
      <PlanBlocksSection goalId="g1" />
    </QueryClientProvider>,
  )
}

describe("PlanBlocksSection", () => {
  it("lists exercises in order with instruction and criterion", () => {
    renderWithBlocks([
      aBlock(),
      aBlock({
        id: "b2",
        position: 1,
        title: "Krok vpřed",
        instruction: null,
        criterion: "3× za sebou bez předběhnutí.",
      }),
    ])

    expect(screen.getAllByRole("listitem")).toHaveLength(2)
    const headings = screen
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent)
    expect(headings).toEqual(["Cvik 1: Sedni u nohy", "Cvik 2: Krok vpřed"])

    // The criterion is shown on the closed block (#63).
    expect(screen.getByText("Kritérium: Sedí 5 s, i když kolem letí míček.")).toBeVisible()
    expect(screen.getByText("Kritérium: 3× za sebou bez předběhnutí.")).toBeVisible()
    expect(screen.getByText("Instrukce: Pes sedí u levé nohy, odměna z levé ruky.")).toBeVisible()
  })

  it("explains an empty plan", () => {
    renderWithBlocks([])

    expect(screen.getByText(/Plán zatím nemá žádný cvik/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Přidat cvik" })).toBeInTheDocument()
  })

  it("asks for the exercise name before adding it", async () => {
    const user = userEvent.setup()
    renderWithBlocks([])

    await user.click(screen.getByRole("button", { name: "Přidat cvik" }))
    const dialog = await screen.findByRole("dialog")

    expect(within(dialog).getByLabelText("Instrukce")).toBeInTheDocument()
    expect(within(dialog).getByLabelText("Kritérium zvládnutí")).toBeInTheDocument()

    await user.click(within(dialog).getByRole("button", { name: "Přidat cvik" }))

    expect(await within(dialog).findByText("Název cviku je povinný")).toBeInTheDocument()
  })
})
