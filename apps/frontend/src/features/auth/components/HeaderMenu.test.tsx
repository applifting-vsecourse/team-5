import type * as Router from "@tanstack/react-router"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { HeaderMenu } from "./HeaderMenu"

let currentPath = "/week"

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof Router>("@tanstack/react-router")
  return {
    ...actual,
    useLocation: () =>
      ({ pathname: currentPath }) as unknown as ReturnType<typeof Router.useLocation>,
    Link: ({ to, children, ...props }: { to?: string; children?: React.ReactNode }) => (
      <a
        href={to ?? "#"}
        {...props}
      >
        {children}
      </a>
    ),
  }
})

vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({
    user: {
      name: "Jan Novák",
      email: "jan.novak@example.com",
      username: "jannovak",
      role: "handler",
    },
  }),
}))

vi.mock("@/features/auth/hooks/useSignOut", () => ({
  useSignOut: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

describe("HeaderMenu", () => {
  beforeEach(() => {
    currentPath = "/week"
  })

  it("names the nav trigger Účet and marks it current on /account", () => {
    currentPath = "/account"
    render(<HeaderMenu isNavigation />)

    const trigger = screen.getByRole("button", { name: "Účet" })
    expect(trigger).toHaveAttribute("aria-current", "page")
    expect(trigger.querySelector(".bg-accent")).toBeTruthy()
  })

  it("does not mark Účet current off the account route", () => {
    currentPath = "/dogs"
    render(<HeaderMenu isNavigation />)

    expect(screen.getByRole("button", { name: "Účet" })).not.toHaveAttribute("aria-current")
  })

  it("keeps the header avatar labelled Uživatelské menu", () => {
    render(<HeaderMenu />)

    expect(screen.getByRole("button", { name: "Uživatelské menu" })).toBeInTheDocument()
  })
})
