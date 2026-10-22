import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, it, vi } from "vitest"

import { SignInForm } from "./SignInForm"

afterEach(cleanup)

it("preserves surrounding spaces in a password accepted at registration", async () => {
  const submit = vi.fn()
  render(
    <SignInForm
      isLoading={false}
      onSubmit={submit}
    />,
  )
  const interaction = userEvent.setup()
  await interaction.type(screen.getByLabelText(/e-?mail/i), "owner@example.com")
  await interaction.type(screen.getByLabelText(/password|heslo/i), " space password ")
  await interaction.click(screen.getByRole("button", { name: /sign in|přihlásit se/i }))
  await waitFor(() => expect(submit).toHaveBeenCalled())
  expect(submit.mock.calls[0]?.[0]).toEqual({
    email: "owner@example.com",
    password: " space password ",
  })
})
