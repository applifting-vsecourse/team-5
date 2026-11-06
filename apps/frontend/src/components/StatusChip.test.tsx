import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { StatusChip } from "./StatusChip"

describe("StatusChip", () => {
  it("renders muted, danger and success tones", () => {
    const { rerender } = render(<StatusChip tone="muted">Načítání</StatusChip>)
    expect(screen.getByText("Načítání")).toHaveAttribute("data-slot", "status-chip")

    rerender(<StatusChip tone="danger">Chyba</StatusChip>)
    expect(screen.getByText("Chyba")).toBeInTheDocument()

    rerender(<StatusChip tone="success">Hotovo</StatusChip>)
    expect(screen.getByText("Hotovo")).toBeInTheDocument()
  })
})
