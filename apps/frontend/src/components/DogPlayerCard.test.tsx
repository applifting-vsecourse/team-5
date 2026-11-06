import type * as Router from "@tanstack/react-router"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { DogMetrics } from "@/lib/dogMetrics"

import { DogPlayerCard } from "@/components/DogPlayerCard"

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof Router>("@tanstack/react-router")
  return {
    ...actual,
    Link: ({
      to,
      params,
      children,
      ...props
    }: {
      to?: string
      params?: { dogId?: string }
      children?: React.ReactNode
      [key: string]: unknown
    }) => (
      <a
        href={(to ?? "#").replace("$dogId", params?.dogId ?? "")}
        {...props}
      >
        {children}
      </a>
    ),
  }
})

const metrics: DogMetrics = {
  timeZone: "Europe/Prague",
  asOf: "2026-11-06",
  weeklyTarget: 3,
  weeklyTrainedDays: 1,
  weeklyTargetReached: false,
  streak: 4,
  successRate: 82,
  ratedSessions: 5,
  weeklyChange: 8,
  weeks: [
    {
      from: "2026-09-14",
      to: "2026-09-20",
      completedSessions: 1,
      trainedDays: 1,
      ratedSessions: 1,
      successRate: 40,
    },
    {
      from: "2026-11-02",
      to: "2026-11-08",
      completedSessions: 2,
      trainedDays: 2,
      ratedSessions: 2,
      successRate: 82,
    },
  ],
}

describe("DogPlayerCard", () => {
  it("shows the dog colour card with metrics, trend and the next training", () => {
    render(
      <DogPlayerCard
        dog={{
          id: "dog-rex",
          name: "Rex",
          color: 2,
          breed: "Border kolie",
          disciplines: ["Canicross"],
        }}
        metrics={metrics}
        activeGoalCount={2}
        goalCount={3}
        nextLabel="Dnes · Přivolání v parku"
      />,
    )

    expect(screen.getByRole("link", { name: /detail psa rex/i })).toHaveAttribute(
      "href",
      "/dogs/dog-rex",
    )
    expect(screen.getByText("Border kolie · Canicross")).toBeInTheDocument()
    expect(screen.getByText("82 %")).toBeInTheDocument()
    expect(screen.getByText("4 dny")).toBeInTheDocument()
    expect(screen.getByText("2/3")).toBeInTheDocument()
    expect(
      screen.getByRole("img", { name: "Úspěšnost za posledních osm týdnů" }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Dnes · Přivolání v parku/)).toBeInTheDocument()
  })
})
