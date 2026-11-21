import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { WeekPickerDialog } from "./WeekPickerDialog"

describe("WeekPickerDialog", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date(2026, 10, 19, 10, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("resets the displayed month to selectedWeek when closed and reopened", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const onSelectWeek = vi.fn()

    const { rerender } = render(
      <WeekPickerDialog
        isOpen
        onOpenChange={onOpenChange}
        selectedWeek="2026-11-16"
        onSelectWeek={onSelectWeek}
      />,
    )

    expect(screen.getByText(/listopad 2026/i)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /další měsíc|next month/i }))
    expect(screen.getByText(/prosinec 2026/i)).toBeInTheDocument()

    rerender(
      <WeekPickerDialog
        isOpen={false}
        onOpenChange={onOpenChange}
        selectedWeek="2026-11-16"
        onSelectWeek={onSelectWeek}
      />,
    )
    rerender(
      <WeekPickerDialog
        isOpen
        onOpenChange={onOpenChange}
        selectedWeek="2026-11-16"
        onSelectWeek={onSelectWeek}
      />,
    )

    expect(screen.getByText(/listopad 2026/i)).toBeInTheDocument()
  })

  it("selects the Monday of the tapped day's week and closes", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const onSelectWeek = vi.fn()

    render(
      <WeekPickerDialog
        isOpen
        onOpenChange={onOpenChange}
        selectedWeek="2026-11-16"
        onSelectWeek={onSelectWeek}
      />,
    )

    await user.click(screen.getByRole("button", { name: /25/ }))

    expect(onSelectWeek).toHaveBeenCalledWith("2026-11-23")
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
