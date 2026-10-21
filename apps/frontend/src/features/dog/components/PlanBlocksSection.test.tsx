import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it } from "vitest"

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

// Radix Select uses pointer capture and scrollIntoView, which jsdom lacks.
beforeAll(() => {
  Object.assign(Element.prototype, {
    hasPointerCapture: () => false,
    releasePointerCapture: () => undefined,
    scrollIntoView: () => undefined,
  })
})

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
    expect(screen.getByRole("button", { name: /^Cvik 1: ?Sedni u nohy/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^Cvik 2: ?Krok vpřed/ })).toBeInTheDocument()

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

  it("only offers the moves that make sense at the ends of the plan", () => {
    renderWithBlocks([aBlock(), aBlock({ id: "b2", position: 1, title: "Krok vpřed" })])

    expect(screen.getByRole("button", { name: "Posunout cvik Sedni u nohy nahoru" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Posunout cvik Sedni u nohy dolů" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Posunout cvik Krok vpřed nahoru" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Posunout cvik Krok vpřed dolů" })).toBeDisabled()
  })

  it("opens a block for editing when it is clicked (#65)", async () => {
    const user = userEvent.setup()
    renderWithBlocks([aBlock()])

    await user.click(screen.getByRole("button", { name: /^Cvik 1: ?Sedni u nohy/ }))
    const dialog = await screen.findByRole("dialog")

    expect(within(dialog).getByRole("heading", { name: "Upravit cvik" })).toBeInTheDocument()
    expect(within(dialog).getByLabelText("Název cviku")).toHaveValue("Sedni u nohy")
    expect(within(dialog).getByLabelText("Kritérium zvládnutí")).toHaveValue(
      "Sedí 5 s, i když kolem letí míček.",
    )
    // Placement only matters for a new exercise.
    expect(within(dialog).queryByText("Zařadit")).not.toBeInTheDocument()
  })

  it("asks before deleting a block and keeps it on cancel", async () => {
    const user = userEvent.setup()
    renderWithBlocks([aBlock()])

    await user.click(screen.getByRole("button", { name: "Smazat cvik Sedni u nohy" }))
    const confirm = await screen.findByRole("alertdialog")
    expect(within(confirm).getByText(/Cvik „Sedni u nohy“ zmizí z plánu/)).toBeInTheDocument()

    await user.click(within(confirm).getByRole("button", { name: "Ponechat" }))

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^Cvik 1: ?Sedni u nohy/ })).toBeInTheDocument()
  })

  it("lets a new exercise go between existing ones (#65)", async () => {
    const user = userEvent.setup()
    renderWithBlocks([aBlock(), aBlock({ id: "b2", position: 1, title: "Krok vpřed" })])

    await user.click(screen.getByRole("button", { name: "Přidat cvik" }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("combobox", { name: "Zařadit" }))

    const options = screen.getAllByRole("option").map((option) => option.textContent)
    expect(options).toEqual(["Na konec plánu", "Na začátek", "Za 1. Sedni u nohy"])
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
