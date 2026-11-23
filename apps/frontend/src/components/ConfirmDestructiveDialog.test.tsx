import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ConfirmDestructiveDialog } from "./ConfirmDestructiveDialog"

function mockViewport(isMdUp: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("48rem") ? isMdUp : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe("ConfirmDestructiveDialog", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    // jsdom lacks pointer capture; vaul calls it when opening the sheet.
    Object.defineProperty(Element.prototype, "setPointerCapture", {
      configurable: true,
      writable: true,
      value: vi.fn(),
    })
    Object.defineProperty(Element.prototype, "releasePointerCapture", {
      configurable: true,
      writable: true,
      value: vi.fn(),
    })
    Object.defineProperty(Element.prototype, "hasPointerCapture", {
      configurable: true,
      writable: true,
      value: vi.fn(() => false),
    })
  })

  it("opens a centred dialog from md up", async () => {
    mockViewport(true)
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(
      <ConfirmDestructiveDialog
        title="Smazat psa"
        description="Tuto akci nelze vrátit."
        confirmLabel="Smazat"
        onConfirm={onConfirm}
        trigger={<button type="button">Otevřít</button>}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Otevřít" }))
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Smazat" }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it("opens a bottom sheet below md", async () => {
    mockViewport(false)
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(
      <ConfirmDestructiveDialog
        title="Smazat psa"
        description="Tuto akci nelze vrátit."
        confirmLabel="Smazat"
        onConfirm={onConfirm}
        trigger={<button type="button">Otevřít</button>}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Otevřít" }))
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Smazat" }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it("keeps red for irreversible actions only", async () => {
    mockViewport(false)
    const user = userEvent.setup()

    render(
      <ConfirmDestructiveDialog
        title="Archivovat psa?"
        description="Psa půjde kdykoli vrátit."
        confirmLabel="Archivovat"
        tone="reversible"
        onConfirm={vi.fn()}
        trigger={<button type="button">Archiv</button>}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Archiv" }))
    expect(screen.getByRole("button", { name: "Archivovat" })).toHaveAttribute(
      "data-variant",
      "default",
    )
  })

  it("uses the destructive button by default", async () => {
    mockViewport(true)
    const user = userEvent.setup()

    render(
      <ConfirmDestructiveDialog
        title="Smazat psa"
        description="Tuto akci nelze vrátit."
        confirmLabel="Smazat"
        onConfirm={vi.fn()}
        trigger={<button type="button">Otevřít</button>}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Otevřít" }))
    expect(screen.getByRole("button", { name: "Smazat" })).toHaveAttribute(
      "data-variant",
      "destructive",
    )
  })
})
