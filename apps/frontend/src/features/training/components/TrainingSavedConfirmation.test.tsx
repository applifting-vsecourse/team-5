import type { AnchorHTMLAttributes, ReactElement } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { todayCalendarDate } from "@/lib/calendarDate"
import { dogKeys } from "@/lib/dogKeys"
import { upcomingTrainingsQueryOptions } from "@/lib/weekTrainings"

import type { TrainingDetail } from "@/features/training/api/trainingSchemas"
import { trainingKeys } from "@/features/training/api/trainingsQueryOptions"

import { TrainingSavedConfirmation } from "./TrainingSavedConfirmation"

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    params,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    to: string
    params?: Record<string, string>
  }) => {
    let href = to
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        href = href.replace(`$${key}`, value)
      })
    }
    return (
      <a
        href={href}
        {...props}
      >
        {children}
      </a>
    )
  },
}))

const aTraining = (): TrainingDetail => ({
  id: "t1",
  date: "2026-10-22",
  status: "COMPLETED",
  dog: { id: "d1", name: "Rex", color: 1 },
  goal: { id: "g1", title: "Chůze u nohy" },
  currentStepId: null,
  exercises: [],
})

const metrics = {
  timeZone: "Europe/Prague",
  asOf: "2026-10-22",
  weeklyTarget: 3,
  weeklyPlannedSessions: 3,
  weeklyCompletedSessions: 2,
  weeklySkippedSessions: 0,
  weeklyTrainedDays: 2,
  weeklyTargetReached: false,
  streak: 4,
  longestStreak: 6,
  trainedDates: ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22"],
  successRate: 80,
  ratedSessions: 2,
  weeklyChange: null,
  weeks: [],
}

function renderConfirmation(options?: { withMetrics?: boolean }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  queryClient.setQueryData(trainingKeys.detail("t1"), aTraining())
  queryClient.setQueryData(upcomingTrainingsQueryOptions(todayCalendarDate()).queryKey, [])
  if (options?.withMetrics) {
    queryClient.setQueryData(dogKeys.metrics("d1"), metrics)
  }

  const ui: ReactElement = (
    <QueryClientProvider client={queryClient}>
      <TrainingSavedConfirmation trainingId="t1" />
    </QueryClientProvider>
  )
  return render(ui)
}

describe("TrainingSavedConfirmation", () => {
  it("shows success message and CTAs without inventing metrics", () => {
    renderConfirmation()

    expect(screen.getByRole("heading", { level: 1, name: "Záznam byl uložen" })).toBeInTheDocument()
    expect(screen.getByText("Trénink psa Rex je zaznamenaný.")).toBeInTheDocument()
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
    expect(screen.queryByText(/dny v řadě!/)).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Pokračovat" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Na přehled" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Profil Rex" })).toBeInTheDocument()
  })

  it("shows streak and weekly target only when metrics exist", () => {
    renderConfirmation({ withMetrics: true })

    expect(screen.getByRole("progressbar", { name: "Hotové z týdenního plánu" })).toHaveAttribute(
      "aria-valuenow",
      "2",
    )
    expect(screen.getByText("2/3")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "4 dny v řadě!" })).toBeInTheDocument()
    expect(screen.getByText("Rekord: 6 dní v řadě.")).toBeInTheDocument()
    expect(screen.getByLabelText("Odcvičené dny tohoto týdne")).toBeInTheDocument()
  })
})
