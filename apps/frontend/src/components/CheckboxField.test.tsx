import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { CheckboxField } from "./CheckboxField"

describe("CheckboxField", () => {
  it("toggles via the labelled touch row", async () => {
    const onCheckedChange = vi.fn()
    const user = userEvent.setup()
    render(
      <CheckboxField
        id="terms"
        label="Souhlasím"
        isChecked={false}
        onCheckedChange={onCheckedChange}
      />,
    )

    await user.click(screen.getByLabelText("Souhlasím"))
    expect(onCheckedChange).toHaveBeenCalledTimes(1)
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it("toggles when clicking the padding of the 44px row", async () => {
    const onCheckedChange = vi.fn()
    const user = userEvent.setup()
    const { container } = render(
      <CheckboxField
        id="terms"
        label="Souhlasím"
        isChecked={false}
        onCheckedChange={onCheckedChange}
      />,
    )

    const row = container.querySelector("label")
    expect(row).not.toBeNull()
    await user.click(row!)
    expect(onCheckedChange).toHaveBeenCalledTimes(1)
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it("does not toggle when disabled", async () => {
    const onCheckedChange = vi.fn()
    const user = userEvent.setup()
    const { container } = render(
      <CheckboxField
        id="terms"
        label="Souhlasím"
        isChecked={false}
        isDisabled
        onCheckedChange={onCheckedChange}
      />,
    )

    await user.click(container.querySelector("label")!)
    expect(onCheckedChange).not.toHaveBeenCalled()
  })
})
