import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { dogKeys } from "@/features/dog/api/dogKeys"

import { TrainingScheduleSection } from "./TrainingScheduleSection"

vi.mock("@/features/dog/hooks/useScheduleTraining", () => ({
  useScheduleTraining: () => ({ isPending: false, mutateAsync: vi.fn() }),
}))

describe("TrainingScheduleSection", () => {
  it("shows every dated session and still offers another training", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } })
    client.setQueryData(dogKeys.goalTrainings("g1"), [
      { id: "t1", date: "2026-10-27", status: "PLANNED" },
      { id: "t2", date: "2026-10-29", status: "PLANNED" },
      { id: "t3", date: "2026-10-31", status: "PLANNED" },
      { id: "t4", date: "2026-10-20", status: "COMPLETED" },
    ])
    render(
      <QueryClientProvider client={client}>
        <TrainingScheduleSection
          goalId="g1"
          dogName="Rex"
        />
      </QueryClientProvider>,
    )
    expect(screen.getAllByRole("listitem")).toHaveLength(4)
    expect(screen.getAllByText("Naplánováno")).toHaveLength(3)
    expect(screen.getByText("Odcvičeno")).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole("button", { name: "Přidat další trénink" }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    client.clear()
  })
})
