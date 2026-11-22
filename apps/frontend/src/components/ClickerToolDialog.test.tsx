import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type * as ClickerAudio from "@/lib/clickerAudio"

import { ClickerToolDialog } from "./ClickerToolDialog"

const { playClickerSound } = vi.hoisted(() => ({
  playClickerSound: vi.fn(() => true),
}))

vi.mock("@/lib/clickerAudio", async () => {
  const actual = await vi.importActual<typeof ClickerAudio>("@/lib/clickerAudio")
  return {
    ...actual,
    playClickerSound,
  }
})

describe("ClickerToolDialog", () => {
  const originalVibrateDescriptor = Object.getOwnPropertyDescriptor(navigator, "vibrate")

  beforeEach(() => {
    playClickerSound.mockClear()
    window.localStorage.clear()
  })

  afterEach(() => {
    if (originalVibrateDescriptor) {
      Object.defineProperty(navigator, "vibrate", originalVibrateDescriptor)
    } else {
      Reflect.deleteProperty(navigator, "vibrate")
    }
  })

  it("opens the standalone clicker dialog, counts clicks, resets, and toggles haptics", async () => {
    const user = userEvent.setup()
    const vibrate = vi.fn(() => true)
    Object.defineProperty(navigator, "vibrate", {
      value: vibrate,
      writable: true,
      configurable: true,
    })

    render(<ClickerToolDialog />)

    await user.click(screen.getByRole("button", { name: "Otevřít klikr" }))

    expect(screen.getByRole("heading", { name: "Klikr" })).toBeInTheDocument()
    const pad = screen.getByRole("button", { name: "Kliknout" })
    const reset = screen.getByRole("button", { name: "Vynulovat" })

    expect(screen.getByRole("status")).toHaveTextContent("0")
    expect(reset).toBeDisabled()

    await user.click(pad)
    await user.click(pad)
    await user.click(pad)

    expect(playClickerSound).toHaveBeenCalledTimes(3)
    expect(vibrate).toHaveBeenCalledTimes(3)
    expect(screen.getByRole("status")).toHaveTextContent("3")

    await user.click(screen.getByRole("button", { name: "Vibrace zapnuty" }))
    expect(screen.getByRole("button", { name: "Vibrace vypnuty" })).toHaveAttribute(
      "aria-pressed",
      "false",
    )

    await user.click(pad)
    expect(vibrate).toHaveBeenCalledTimes(3)
    expect(screen.getByRole("status")).toHaveTextContent("4")

    await user.click(reset)
    expect(screen.getByRole("status")).toHaveTextContent("0")
    expect(reset).toBeDisabled()
  })
})
