import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { dogKeys } from "@/lib/dogKeys"

import { EditGoalPage } from "./GoalEditorPage"

const { navigate, save } = vi.hoisted(() => ({ navigate: vi.fn(), save: vi.fn() }))
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
  Link: ({
    to,
    params,
    children,
    ...props
  }: {
    to?: string
    params?: { dogId?: string; activityId?: string }
    children: ReactNode
    [key: string]: unknown
  }) => {
    let href = typeof to === "string" ? to : "#"
    if (params?.dogId) href = href.replace("$dogId", params.dogId)
    if (params?.activityId) href = href.replace("$activityId", params.activityId)
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
vi.mock("@/features/dog/hooks/useUpdateGoal", () => ({
  useUpdateGoal: () => ({ mutateAsync: save, isPending: false }),
}))
vi.mock("./EditorSheet", () => ({
  EditorSheet: ({ isOpen, children }: { isOpen: boolean; children: ReactNode }) =>
    isOpen ? <section>{children}</section> : null,
}))

function mount(returnToActivityId?: string) {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } })
  client.setQueryData(dogKeys.detail("dog"), { id: "dog", name: "Rex", disciplines: [] })
  client.setQueryData(dogKeys.goal("goal"), {
    id: "goal",
    dogId: "dog",
    title: "Přivolání",
    status: "ACTIVE",
    updatedAt: new Date(),
  })
  client.setQueryData(
    [...dogKeys.detail("dog"), "plan"],
    [
      {
        isArchived: false,
        goals: [
          {
            id: "goal",
            sessions: [
              { id: "archived", title: "Archiv", isArchived: true, steps: [] },
              { id: "session", title: "V parku", isArchived: false, steps: [] },
            ],
          },
        ],
      },
    ],
  )
  // Keep this test focused on saving and navigation rather than network refresh.
  vi.spyOn(client, "invalidateQueries").mockResolvedValue()
  return render(
    <QueryClientProvider client={client}>
      <EditGoalPage
        dogId="dog"
        goalId="goal"
        returnToActivityId={returnToActivityId}
      />
    </QueryClientProvider>,
  )
}

describe("save and schedule goal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    save.mockResolvedValue({})
  })
  it("saves before opening a non-archived training with the schedule flag", async () => {
    const user = userEvent.setup()
    mount()
    await user.click(screen.getByRole("button", { name: "Upravit cíl" }))
    await user.click(screen.getByRole("button", { name: "Uložit a naplánovat" }))
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: "/dogs/$dogId/goals/$goalId",
        params: { dogId: "dog", goalId: "goal" },
        search: { session: "session", naplanovat: true },
      }),
    )
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ title: "Přivolání" }))
  })
  it("keeps the form open and does not navigate after a failed save", async () => {
    save.mockRejectedValueOnce(new Error("Offline"))
    const user = userEvent.setup()
    mount()
    await user.click(screen.getByRole("button", { name: "Upravit cíl" }))
    await user.click(screen.getByRole("button", { name: "Uložit a naplánovat" }))
    await waitFor(() => expect(save).toHaveBeenCalledOnce())
    expect(navigate).not.toHaveBeenCalled()
    expect(screen.getByLabelText("Název cíle")).toHaveValue("Přivolání")
  })
  it("returns to the originating training record after saving changes", async () => {
    const user = userEvent.setup()
    mount("act-1")
    expect(screen.getByRole("link", { name: "Zpět na záznam tréninku" })).toHaveAttribute(
      "href",
      "/dogs/dog/activities/act-1",
    )
    await user.click(screen.getByRole("button", { name: "Upravit cíl" }))
    await user.click(screen.getByRole("button", { name: "Uložit" }))
    const returnButton = await screen.findByRole("button", { name: "Hotovo, zpět na záznam" })
    await user.click(returnButton)
    expect(navigate).toHaveBeenCalledWith({
      to: "/dogs/$dogId/activities/$activityId",
      params: { dogId: "dog", activityId: "act-1" },
    })
  })
  it("preserves zaznam param when saving and scheduling", async () => {
    const user = userEvent.setup()
    mount("act-1")
    await user.click(screen.getByRole("button", { name: "Upravit cíl" }))
    await user.click(screen.getByRole("button", { name: "Uložit a naplánovat" }))
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: "/dogs/$dogId/goals/$goalId",
        params: { dogId: "dog", goalId: "goal" },
        search: { session: "session", naplanovat: true, zaznam: "act-1" },
      }),
    )
  })
})
