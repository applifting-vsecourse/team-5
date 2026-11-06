import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { PlanBlock } from "@/features/dog/api/dogSchemas"

import { TrainingPreview } from "./TrainingPreview"

const steps: PlanBlock[] = ["Přivolání", "Chůze u nohy"].map((title, index) => ({
  id: `step-${index}`,
  goalId: "goal",
  position: index,
  title,
  instruction: "Odměna u nohy.",
  criterion: "Přijde na první povel.",
  durationMinutes: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
}))

describe("training preview", () => {
  it("walks all steps locally and returns to the editor without saving progress", async () => {
    const close = vi.fn()
    const fetch = vi.spyOn(globalThis, "fetch")
    const user = userEvent.setup()
    render(
      <TrainingPreview
        dog={{ name: "Rex", color: 2 }}
        title="V parku"
        steps={steps}
        isOpen
        onOpenChange={close}
      />,
    )
    expect(screen.getByRole("heading", { name: "Přivolání" })).toBeInTheDocument()
    expect(screen.getByRole("timer")).toHaveTextContent("1:00")
    await user.click(screen.getByRole("button", { name: "Hotovo, další krok" }))
    expect(screen.getByRole("heading", { name: "Chůze u nohy" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Dokončit náhled" }))
    expect(close).toHaveBeenCalledWith(false)
    expect(fetch).not.toHaveBeenCalled()
    fetch.mockRestore()
  })
  it("starts, pauses and resets the timer", async () => {
    const user = userEvent.setup()
    render(
      <TrainingPreview
        dog={{ name: "Rex", color: 2 }}
        title="V parku"
        steps={steps}
        isOpen
        onOpenChange={vi.fn()}
      />,
    )
    await user.click(screen.getByRole("button", { name: "Spustit časovač" }))
    await waitFor(() => expect(screen.getByRole("timer")).toHaveTextContent("0:59"), {
      timeout: 3000,
    })
    await user.click(screen.getByRole("button", { name: "Pozastavit časovač" }))
    await user.click(screen.getByRole("button", { name: "Vynulovat časovač" }))
    expect(screen.getByRole("timer")).toHaveTextContent("1:00")
  })
})
