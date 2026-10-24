import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { weekKeys } from "@/lib/weekKeys"

import { dogKeys } from "@/features/dog/api/dogKeys"

import { useScheduleTraining } from "./useScheduleTraining"

vi.mock("@/features/dog/api/scheduleTraining", () => ({
  scheduleTraining: vi.fn().mockResolvedValue({
    id: "t1",
    goalId: "g1",
    dogId: "d1",
    date: "2026-10-22",
    status: "PLANNED",
    createdAt: new Date(),
  }),
}))

describe("useScheduleTraining", () => {
  it("refreshes the goal's trainings and the week after planning (#72)", async () => {
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useScheduleTraining("g1"), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    })

    await act(() => result.current.mutateAsync("2026-10-22"))

    expect(invalidate).toHaveBeenCalledWith({ queryKey: dogKeys.goalTrainings("g1") })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: weekKeys.all })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: dogKeys.plannedTrainings("d1") })
  })
})
