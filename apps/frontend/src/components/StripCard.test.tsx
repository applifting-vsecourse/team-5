import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { StripCard } from "./StripCard"

describe("StripCard", () => {
  it("renders as article with a dog-colour strip when color is set", () => {
    const { container } = render(
      <StripCard dogColor={2}>
        <p>Rex</p>
      </StripCard>,
    )

    expect(screen.getByText("Rex")).toBeInTheDocument()
    expect(container.querySelector('[data-slot="strip-card"]')).toBeTruthy()
    expect(container.querySelector(".bg-dog-2")).toBeTruthy()
  })

  it("omits the strip without dogColor and can render as li", () => {
    const { container } = render(
      <StripCard as="li">
        <p>bez barvy</p>
      </StripCard>,
    )

    expect(container.querySelector("li[data-slot='strip-card']")).toBeTruthy()
    expect(container.querySelector("[class*='bg-dog-']")).toBeNull()
  })
})
