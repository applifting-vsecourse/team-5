import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Metric } from "./Metric"

describe("Metric", () => {
  it("renders value and label", () => {
    render(
      <Metric
        value="3"
        label="série"
      />,
    )
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("série")).toBeInTheDocument()
  })

  it("uses hero text tokens when isOnHero", () => {
    const { container } = render(
      <Metric
        value="70 %"
        label="úspěšnost"
        isOnHero
      />,
    )
    expect(container.querySelector(".text-hero-foreground")).toBeTruthy()
    expect(container.querySelector(".text-hero-muted")).toBeTruthy()
  })
})
