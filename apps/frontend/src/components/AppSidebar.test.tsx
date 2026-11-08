import type * as Router from "@tanstack/react-router"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { AppSidebar } from "./AppSidebar"

let currentPath = "/dashboard"

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

describe("AppSidebar", () => {
  it("renders handler navigation with Historie and Zprávy", () => {
    currentPath = "/dashboard"
    render(
      <AppSidebar
        user={{ name: "Jan Novák" }}
        isTrainer={false}
      />,
    )

    expect(screen.getByRole("navigation", { name: "Hlavní navigace" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Dnes/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Týden/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Moji psi/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Historie/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Zprávy/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Účet/ })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /Klienti/ })).not.toBeInTheDocument()
    expect(screen.getByText("Psovod")).toBeInTheDocument()
  })

  it("renders trainer navigation with Klienti, Historie and Zprávy", () => {
    currentPath = "/dashboard"
    render(
      <AppSidebar
        user={{ name: "Petr Trenér" }}
        isTrainer={true}
      />,
    )

    expect(screen.getByRole("link", { name: /Přehled/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Klienti/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Kalendář/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Moji psi/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Historie/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Zprávy/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Účet/ })).toBeInTheDocument()
    expect(screen.getByText("Trenér")).toBeInTheDocument()
  })
})
