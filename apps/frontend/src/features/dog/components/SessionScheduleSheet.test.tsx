import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"
import { dogKeys } from "@/lib/dogKeys"

import { localDay, SessionScheduleSheet } from "./SessionScheduleSheet"

vi.mock("@/lib/api-client", () => ({
  api: { post: vi.fn(), get: vi.fn(() => ({ json: () => Promise.resolve([]) })) },
}))
vi.mock("./EditorSheet", () => ({
  EditorSheet: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock("@/components/ui/calendar", () => ({
  Calendar: ({ onSelect }: { onSelect: (dates: Date[]) => void }) => (
    <button onClick={() => onSelect([new Date(2099, 10, 3, 12), new Date(2099, 10, 5, 12)])}>
      Vybrat dva dny
    </button>
  ),
}))

beforeEach(() => vi.clearAllMocks())

it("schedules a concrete training and retries only the remaining day after a partial failure", async () => {
  vi.mocked(api.post)
    .mockResolvedValueOnce({} as never)
    .mockRejectedValueOnce(new Error("Offline"))
    .mockResolvedValue({} as never)
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  client.setQueryData(dogKeys.goalTrainings("goal-1"), [])
  const onOpenChange = vi.fn()
  render(
    <QueryClientProvider client={client}>
      <SessionScheduleSheet
        sessionId="session-2"
        goalId="goal-1"
        dogId="dog-1"
        description="Rex"
        isOpen
        onOpenChange={onOpenChange}
      />
    </QueryClientProvider>,
  )
  const user = userEvent.setup()
  await user.click(screen.getByRole("button", { name: "Vybrat dva dny" }))
  await user.click(screen.getByRole("button", { name: "Naplánovat 2 tréninky" }))
  await screen.findByRole("alert")
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Naplánovat 1 trénink" })).toBeEnabled(),
  )
  await user.click(screen.getByRole("button", { name: "Naplánovat 1 trénink" }))
  await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  expect(api.post).toHaveBeenCalledTimes(3)
  expect(api.post).toHaveBeenNthCalledWith(1, "goal-trainings/session-2/schedule", {
    json: { date: "2099-11-03" },
  })
  expect(api.post).toHaveBeenLastCalledWith("goal-trainings/session-2/schedule", {
    json: { date: "2099-11-05" },
  })
})

it("uses the local calendar date instead of converting a selected day to UTC", () => {
  expect(localDay(new Date(2099, 10, 3, 0, 1))).toBe("2099-11-03")
})
