import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { QueryState } from "./QueryState"

/** Behaviour: loading / error+retry / empty / children. Module: QueryState.tsx. No prior tests. */
describe("QueryState", () => {
  it("shows loading skeleton", () => {
    render(
      <QueryState
        isLoading
        empty={<p>prázdné</p>}
      >
        <p>data</p>
      </QueryState>,
    )

    expect(screen.getByLabelText("Načítám")).toBeInTheDocument()
    expect(screen.getByText("Načítání")).toBeInTheDocument()
    expect(screen.queryByText("data")).not.toBeInTheDocument()
  })

  it("shows error with retry", async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(
      <QueryState
        error={new Error("síť")}
        onRetry={onRetry}
        empty={<p>prázdné</p>}
      >
        <p>data</p>
      </QueryState>,
    )

    expect(screen.getByRole("heading", { name: "Nepodařilo se načíst data" })).toBeInTheDocument()
    expect(screen.getByText("síť")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Zkusit znovu" }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it("shows empty and children", () => {
    const { rerender } = render(
      <QueryState
        isEmpty
        empty={<p>nic tu není</p>}
      >
        <p>data</p>
      </QueryState>,
    )
    expect(screen.getByText("nic tu není")).toBeInTheDocument()

    rerender(
      <QueryState empty={<p>nic tu není</p>}>
        <p>data</p>
      </QueryState>,
    )
    expect(screen.getByText("data")).toBeInTheDocument()
  })
})
