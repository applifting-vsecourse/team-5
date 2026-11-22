import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type * as ClickerAudio from "@/lib/clickerAudio"

import { WalkthroughClickerBar } from "./WalkthroughClickerBar"

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

describe("WalkthroughClickerBar", () => {
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

  it("plays click sound, increments the counter, and resets back to 0", async () => {
    const user = userEvent.setup()
    Object.defineProperty(navigator, "vibrate", {
      value: undefined,
      writable: true,
      configurable: true,
    })

    render(<WalkthroughClickerBar />)

    const clickerButton = screen.getByRole("button", { name: /Klikr/i })
    const resetButton = screen.getByRole("button", { name: "Vynulovat počítadlo kliknutí" })

    expect(screen.getByRole("status")).toHaveTextContent("0")
    expect(resetButton).toBeDisabled()
    expect(screen.queryByRole("button", { name: /haptickou odezvu/i })).not.toBeInTheDocument()

    await user.click(clickerButton)
    await user.click(clickerButton)

    expect(playClickerSound).toHaveBeenCalledTimes(2)
    expect(screen.getByRole("status")).toHaveTextContent("2")
    expect(resetButton).toBeEnabled()

    await user.click(resetButton)

    expect(screen.getByRole("status")).toHaveTextContent("0")
    expect(resetButton).toBeDisabled()
  })

  it("allows toggling haptic feedback when navigator.vibrate is supported", async () => {
    const user = userEvent.setup()
    const vibrate = vi.fn(() => true)
    Object.defineProperty(navigator, "vibrate", {
      value: vibrate,
      writable: true,
      configurable: true,
    })

    render(<WalkthroughClickerBar />)

    const clickerButton = screen.getByRole("button", { name: /Klikr/i })
    const hapticToggle = screen.getByRole("button", { name: "Vypnout haptickou odezvu" })
    expect(hapticToggle).toHaveAttribute("aria-pressed", "true")

    await user.click(clickerButton)
    expect(vibrate).toHaveBeenCalledTimes(1)

    await user.click(hapticToggle)
    expect(screen.getByRole("button", { name: "Zapnout haptickou odezvu" })).toHaveAttribute(
      "aria-pressed",
      "false",
    )

    await user.click(clickerButton)
    expect(vibrate).toHaveBeenCalledTimes(1)
  })
})
