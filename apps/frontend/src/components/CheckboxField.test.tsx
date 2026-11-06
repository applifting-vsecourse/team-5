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
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })
})
