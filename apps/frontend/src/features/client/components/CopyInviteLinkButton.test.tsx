import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { CopyInviteLinkButton } from "./CopyInviteLinkButton"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const link = `${window.location.origin}/invite?code=ZSG3FW`

describe("CopyInviteLinkButton (#58)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("copies the link with the code and confirms it", async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue()
    render(<CopyInviteLinkButton code="ZSG3FW" />)

    await user.click(screen.getByRole("button", { name: "Zkopírovat odkaz s kódem ZSG3FW" }))

    expect(writeText).toHaveBeenCalledWith(link)
    expect(toast.success).toHaveBeenCalledWith("Odkaz s kódem je zkopírovaný")
  })

  it("shows the link to copy by hand when the clipboard is blocked", async () => {
    const user = userEvent.setup()
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"))
    render(
      <CopyInviteLinkButton
        code="ZSG3FW"
        isCompact
      />,
    )

    await user.click(screen.getByRole("button", { name: "Zkopírovat odkaz s kódem ZSG3FW" }))

    expect(toast.error).toHaveBeenCalledWith(`Zkopírovat se nepodařilo. Odkaz: ${link}`)
  })
})
