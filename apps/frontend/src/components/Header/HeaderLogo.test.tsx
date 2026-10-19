import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { HeaderLogo } from "./HeaderLogo"

// Mock @tanstack/react-router Link
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    className,
  }: {
    children: React.ReactNode
    to: string
    className?: string
  }) => (
    <a
      href={to}
      className={className}
    >
      {children}
    </a>
  ),
}))

describe("HeaderLogo", () => {
  it("renders TrainLoop logo linking to home", () => {
    render(<HeaderLogo />)
    const logoLink = screen.getByRole("link", { name: /trainloop/i })
    expect(logoLink).toBeInTheDocument()
    expect(logoLink).toHaveAttribute("href", "/")
  })
})
