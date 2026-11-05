import { render, screen } from "@testing-library/react"
import { PawPrint } from "lucide-react"
import { describe, expect, it } from "vitest"

import { EmptyState } from "./EmptyState"

/** Behaviour: chip + title + description + action. Module: EmptyState.tsx. No prior tests. */
describe("EmptyState", () => {
  it("renders chip, title, description and action", () => {
    render(
      <EmptyState
        icon={PawPrint}
        chip="BEZ PSA"
        title="Ještě tu nemáš psa"
        description="Přidej prvního psa."
        action={<button type="button">Přidat</button>}
      />,
    )

    expect(screen.getByText("BEZ PSA")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Ještě tu nemáš psa" })).toBeInTheDocument()
    expect(screen.getByText("Přidej prvního psa.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Přidat" })).toBeInTheDocument()
  })
})
