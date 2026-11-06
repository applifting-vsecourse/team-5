import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { QueryState } from "./QueryState"

describe("QueryState", () => {
  it("shows loading skeleton with status role", () => {
    render(
      <QueryState
        isLoading
        empty={<p>prázdné</p>}
      >
        <p>data</p>
      </QueryState>,
    )

    expect(screen.getByRole("status", { name: "Načítám" })).toBeInTheDocument()
    expect(screen.getByText("Načítání")).toBeInTheDocument()
    expect(screen.queryByText("data")).not.toBeInTheDocument()
  })

  it("shows error with retry and default CHYBA chip", async () => {
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
    expect(screen.getByText("CHYBA")).toBeInTheDocument()
    expect(screen.queryByText("BEZ PŘIPOJENÍ")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Zkusit znovu" }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it("allows a custom error chip or none", () => {
    const { rerender } = render(
      <QueryState
        error={new Error("x")}
        errorChip="BEZ PŘIPOJENÍ"
        empty={<p>prázdné</p>}
      >
        <p>data</p>
      </QueryState>,
    )
    expect(screen.getByText("BEZ PŘIPOJENÍ")).toBeInTheDocument()

    rerender(
      <QueryState
        error={new Error("x")}
        errorChip={null}
        empty={<p>prázdné</p>}
      >
        <p>data</p>
      </QueryState>,
    )
    expect(screen.queryByText("BEZ PŘIPOJENÍ")).not.toBeInTheDocument()
    expect(screen.queryByText("CHYBA")).not.toBeInTheDocument()
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
