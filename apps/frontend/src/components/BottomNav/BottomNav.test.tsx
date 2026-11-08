import type * as Router from "@tanstack/react-router"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { BottomNav } from "./BottomNav"

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

describe("BottomNav", () => {
  it("renders handler tabs: Dnes, Týden, Psi, Historie, Účet", () => {
    currentPath = "/week"
    render(<BottomNav />)

    expect(screen.getByRole("navigation", { name: "Spodní navigace" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Dnes" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Týden" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Psi" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Historie" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Zprávy" })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Účet" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Klienti" })).not.toBeInTheDocument()
  })

  it("renders trainer tabs: Přehled, Klienti, Historie, Účet", () => {
    currentPath = "/clients"
    render(<BottomNav isTrainer />)

    expect(screen.getByRole("link", { name: "Přehled" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Klienti" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Cíle" })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Historie" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Zprávy" })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Účet" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Dnes" })).not.toBeInTheDocument()
  })

  it("hides the bottom nav on training walkthrough routes (#76)", () => {
    currentPath = "/trainings/t1"
    const { container } = render(<BottomNav />)

    expect(container).toBeEmptyDOMElement()
  })

  it("keeps Účet a page destination even if a legacy menu slot is provided", () => {
    currentPath = "/week"
    render(<BottomNav accountMenu={<button type="button">Účet</button>} />)

    expect(screen.getByRole("link", { name: "Účet" })).toHaveAttribute("href", "/account")
    expect(screen.queryByRole("button", { name: "Účet" })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Dnes" })).toBeInTheDocument()
  })
})
