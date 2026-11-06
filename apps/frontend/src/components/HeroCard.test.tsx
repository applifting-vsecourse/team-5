import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { HeroCard, HeroChip } from "./HeroCard"

describe("HeroCard", () => {
  it("renders eyebrow and children on the hero surface", () => {
    render(
      <HeroCard eyebrow="DALŠÍ TRÉNINK">
        <p>Start na povel</p>
        <HeroChip>dnes</HeroChip>
      </HeroCard>,
    )

    expect(screen.getByText("DALŠÍ TRÉNINK")).toBeInTheDocument()
    expect(screen.getByText("Start na povel")).toBeInTheDocument()
    expect(screen.getByText("dnes")).toBeInTheDocument()
  })
})
