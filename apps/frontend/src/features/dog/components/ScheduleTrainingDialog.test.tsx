import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ScheduleTrainingDialog } from "./ScheduleTrainingDialog"

const renderDialog = (onSchedule = vi.fn().mockResolvedValue(undefined)) => {
  render(
    <ScheduleTrainingDialog
      dogName="Rex"
      isOpen
      onOpenChange={vi.fn()}
      isPending={false}
      onSchedule={onSchedule}
    />,
  )
  return { onSchedule }
}

describe("ScheduleTrainingDialog", () => {
  beforeEach(() => {
    // Wednesday 21 Oct 2026. Only Date is faked so user events still run.
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date(2026, 9, 21, 10, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("asks when the dog trains and preselects today", () => {
    renderDialog()

    expect(screen.getByRole("heading", { name: "Kdy má Rex cvičit?" })).toBeInTheDocument()
    expect(screen.getByText("19.–25. října")).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: "středa 21. 10." })).toBeChecked()
    expect(screen.getByRole("button", { name: "Naplánovat na středu 21. 10." })).toBeEnabled()
  })

  it("does not offer days in the past", () => {
    renderDialog()

    expect(screen.getByRole("radio", { name: "pondělí 19. 10." })).toBeDisabled()
    expect(screen.getByRole("radio", { name: "úterý 20. 10." })).toBeDisabled()
    expect(screen.getByRole("radio", { name: "čtvrtek 22. 10." })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Předchozí týden" })).toBeDisabled()
  })

  it("disables existing sessions but allows another day for the same goal", async () => {
    const user = userEvent.setup()
    const onSchedule = vi.fn().mockResolvedValue(undefined)
    render(
      <ScheduleTrainingDialog
        dogName="Rex"
        isOpen
        onOpenChange={vi.fn()}
        isPending={false}
        onSchedule={onSchedule}
        plannedDates={["2026-10-21", "2026-10-23"]}
      />,
    )
    expect(screen.getByRole("radio", { name: "středa 21. 10." })).toBeDisabled()
    expect(screen.getByRole("radio", { name: "pátek 23. 10." })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Vyberte den tréninku" })).toBeDisabled()
    await user.click(screen.getByRole("radio", { name: "čtvrtek 22. 10." }))
    await user.click(screen.getByRole("button", { name: "Naplánovat na čtvrtek 22. 10." }))
    expect(onSchedule).toHaveBeenCalledWith("2026-10-22")
  })

  it("plans the chosen day, also in a later week", async () => {
    const user = userEvent.setup()
    const { onSchedule } = renderDialog()

    await user.click(screen.getByRole("button", { name: "Další týden" }))
    expect(screen.getByText("26. října – 1. listopadu")).toBeInTheDocument()

    await user.click(screen.getByRole("radio", { name: "pondělí 26. 10." }))
    await user.click(screen.getByRole("button", { name: "Naplánovat na pondělí 26. 10." }))

    expect(onSchedule).toHaveBeenCalledWith("2026-10-26")
  })
})
