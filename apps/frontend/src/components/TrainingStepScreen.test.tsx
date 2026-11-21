import { act, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { TrainingStepScreen } from "./TrainingStepScreen"

describe("unlimited step timer", () => {
  afterEach(() => vi.useRealTimers())

  it("shows completed minutes and resets when moving to another step", () => {
    vi.useFakeTimers()
    const props = {
      title: "Trénink",
      dog: { name: "Rex", color: 1 },
      steps: [
        { id: "first", title: "Přivolání" },
        { id: "second", title: "Sedni" },
      ],
      closeControl: null,
      actions: null,
      shouldAutoStartTimer: true,
    }
    const { rerender } = render(
      <TrainingStepScreen
        {...props}
        index={0}
      />,
    )
    expect(screen.getByRole("timer", { name: "Uplynulý čas" })).toHaveTextContent("0 min")
    act(() => {
      vi.advanceTimersByTime(59000)
    })
    expect(screen.getByRole("timer")).toHaveTextContent("0 min")
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByRole("timer")).toHaveTextContent("1 min")
    expect(screen.getByText("bez časového limitu")).toBeInTheDocument()
    rerender(
      <TrainingStepScreen
        {...props}
        index={1}
      />,
    )
    expect(screen.getByRole("timer")).toHaveTextContent("0 min")
  })
})
