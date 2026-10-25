import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook } from "@testing-library/react"
import { HTTPError, type NormalizedOptions } from "ky"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { dogKeys } from "@/lib/dogKeys"
import { weekKeys } from "@/lib/weekKeys"

import { skipTraining, undoSkip } from "@/features/week/api/skipTraining"

import { useSkipTraining, useUndoSkip } from "./useSkipTraining"

vi.mock("@/features/week/api/skipTraining", () => ({
  skipTraining: vi.fn(),
  undoSkip: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const aTraining = (status: "PLANNED" | "SKIPPED") => ({
  id: "t1",
  goalId: "g1",
  dogId: "d1",
  date: "2026-10-22",
  status,
})

const httpError = (status: number) => {
  const request = new Request("http://localhost/api/trainings/t1/skip")
  return new HTTPError(new Response(null, { status }), request, {} as NormalizedOptions)
}

const renderWithClient = <T,>(useHook: () => T) => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const invalidate = vi.spyOn(queryClient, "invalidateQueries")
  const { result } = renderHook(useHook, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  })
  return { result, invalidate }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("useSkipTraining", () => {
  it("refreshes the week, the goal, the dog's planned trainings and Activities", async () => {
    vi.mocked(skipTraining).mockResolvedValue(aTraining("SKIPPED"))
    const { result, invalidate } = renderWithClient(() => useSkipTraining("t1"))

    await act(() => result.current.mutateAsync())

    expect(invalidate).toHaveBeenCalledWith({ queryKey: weekKeys.all })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: dogKeys.goalTrainings("g1") })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: dogKeys.plannedTrainings("d1") })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: dogKeys.activities("d1") })
    expect(toast.success).toHaveBeenCalledWith(
      "Trénink je přeskočený. Do konce týdne to můžete vrátit.",
    )
  })

  it("on 409 says the training is no longer planned and reloads the week", async () => {
    vi.mocked(skipTraining).mockRejectedValue(httpError(409))
    const { result, invalidate } = renderWithClient(() => useSkipTraining("t1"))

    await act(() => result.current.mutateAsync().catch(() => undefined))

    expect(toast.error).toHaveBeenCalledWith("Trénink už není naplánovaný, přeskočit ho nejde.")
    expect(invalidate).toHaveBeenCalledWith({ queryKey: weekKeys.all })
  })

  it("on another error asks to try again and leaves the data alone", async () => {
    vi.mocked(skipTraining).mockRejectedValue(httpError(500))
    const { result, invalidate } = renderWithClient(() => useSkipTraining("t1"))

    await act(() => result.current.mutateAsync().catch(() => undefined))

    expect(toast.error).toHaveBeenCalledWith(
      "Trénink se nepodařilo přeskočit. Zkuste to prosím znovu.",
    )
    expect(invalidate).not.toHaveBeenCalled()
  })
})

describe("useUndoSkip", () => {
  it("refreshes the same data as a skip and confirms the training is planned again", async () => {
    vi.mocked(undoSkip).mockResolvedValue(aTraining("PLANNED"))
    const { result, invalidate } = renderWithClient(() => useUndoSkip("t1"))

    await act(() => result.current.mutateAsync())

    expect(invalidate).toHaveBeenCalledWith({ queryKey: weekKeys.all })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: dogKeys.activities("d1") })
    expect(toast.success).toHaveBeenCalledWith("Trénink je zase naplánovaný")
  })

  it("on 409 explains why the skip can't be taken back and reloads the week", async () => {
    vi.mocked(undoSkip).mockRejectedValue(httpError(409))
    const { result, invalidate } = renderWithClient(() => useUndoSkip("t1"))

    await act(() => result.current.mutateAsync().catch(() => undefined))

    expect(toast.error).toHaveBeenCalledWith(
      "Přeskočení už vrátit nejde. Cíl má na ten den jiný trénink, nebo týden skončil.",
    )
    expect(invalidate).toHaveBeenCalledWith({ queryKey: weekKeys.all })
  })

  it("on another error asks to try again and leaves the data alone", async () => {
    vi.mocked(undoSkip).mockRejectedValue(new TypeError("Failed to fetch"))
    const { result, invalidate } = renderWithClient(() => useUndoSkip("t1"))

    await act(() => result.current.mutateAsync().catch(() => undefined))

    expect(toast.error).toHaveBeenCalledWith(
      "Přeskočení se nepodařilo vrátit. Zkuste to prosím znovu.",
    )
    expect(invalidate).not.toHaveBeenCalled()
  })
})
