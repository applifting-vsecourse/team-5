import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PerformanceLegend } from "./PerformanceLegend"

describe("PerformanceLegend", () => {
  it("lists the four success-rate bands", () => {
    render(<PerformanceLegend />)

    expect(screen.getByRole("list", { name: "Legenda úspěšnosti" })).toBeInTheDocument()
    expect(screen.getByText("pod 50 %")).toBeInTheDocument()
    expect(screen.getByText("50–65 %")).toBeInTheDocument()
    expect(screen.getByText("65–80 %")).toBeInTheDocument()
    expect(screen.getByText("80 % a víc")).toBeInTheDocument()
  })
})
