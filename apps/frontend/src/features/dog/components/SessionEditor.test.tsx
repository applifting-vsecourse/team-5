import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"

import type { Dog, DogGoal } from "@/features/dog/api/dogSchemas"
import type { TrainingSession } from "@/features/dog/api/trainingEditor"

import { SessionEditor } from "./SessionEditor"

vi.mock("@/lib/api-client", () => ({
  api: { post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
vi.mock("./EditorSheet", () => ({
  EditorSheet: ({
    isOpen,
    title,
    children,
  }: {
    isOpen: boolean
    title: string
    children: ReactNode
  }) => (isOpen ? <section aria-label={title}>{children}</section> : null),
}))
vi.mock("./SessionScheduleSheet", () => ({ SessionScheduleSheet: () => null }))
vi.mock("@/components/ConfirmDestructiveDialog", () => ({ ConfirmDestructiveDialog: () => null }))

const dog = {
  id: "dog-1",
  name: "Rex",
  color: 2,
  ownerId: "owner",
  disciplines: ["Poslušnost"],
} as Dog
const goal = {
  id: "goal-1",
  dogId: dog.id,
  title: "Přivolání",
  discipline: "Poslušnost",
  principle: "Odměňuj u nohy.",
  currentStepId: null,
} as DogGoal
const session: TrainingSession = {
  id: "session-2",
  goalId: goal.id,
  title: "Přivolání v parku",
  position: 1,
  isArchived: false,
  steps: [],
}
const mount = (isReadOnly = false) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        })
      }
    >
      <SessionEditor
        session={session}
        sessions={[session]}
        dog={dog}
        goal={goal}
        isReadOnly={isReadOnly}
        onBack={vi.fn()}
      />
    </QueryClientProvider>,
  )

describe("training editor", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.post).mockResolvedValue({} as never)
  })
  it("saves a new step under the selected training with its criterion and duration", async () => {
    const user = userEvent.setup()
    mount()
    await user.click(screen.getByRole("button", { name: "Nový krok" }))
    await user.type(screen.getByLabelText("Název kroku"), "Návrat")
    await user.type(screen.getByLabelText("Instrukce"), "Odměň u nohy")
    await user.type(screen.getByLabelText("Hotovo, když…"), "Vrátí se na první povel")
    await user.click(screen.getByRole("button", { name: "Přidat krok" }))
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("goal-trainings/session-2/steps", {
        json: {
          title: "Návrat",
          instruction: "Odměň u nohy",
          criterion: "Vrátí se na první povel",
          durationMinutes: 5,
        },
      }),
    )
  })
  it("keeps entered values after a failed save", async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error("Offline"))
    const user = userEvent.setup()
    mount()
    await user.click(screen.getByRole("button", { name: "Nový krok" }))
    await user.type(screen.getByLabelText("Název kroku"), "Návrat")
    await user.click(screen.getByRole("button", { name: "Přidat krok" }))
    await waitFor(() => expect(api.post).toHaveBeenCalled())
    expect(screen.getByLabelText("Název kroku")).toHaveValue("Návrat")
  })
  it("copies templates into this training and retries only templates that failed", async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({} as never)
      .mockRejectedValueOnce(new Error("Offline"))
      .mockResolvedValue({} as never)
    const user = userEvent.setup()
    mount()
    await user.click(screen.getByRole("button", { name: "Z knihovny" }))
    await user.click(screen.getByRole("button", { name: /Přivolání na píšťalku/ }))
    await user.click(screen.getByRole("button", { name: /Přivolání od jiného psa/ }))
    await user.click(screen.getByRole("button", { name: "+ Přidat do tréninku" }))
    await screen.findByRole("alert")
    expect(api.post).toHaveBeenCalledTimes(2)
    expect(api.post).toHaveBeenNthCalledWith(1, "goal-trainings/session-2/steps", {
      json: {
        title: "Přivolání na píšťalku",
        instruction: "Zapískej jednou. Jakmile pes přiběhne, odměň ho u nohy.",
        criterion: "Přiběhne do 3 s na 10 m",
        durationMinutes: 8,
      },
    })
    await user.click(screen.getByRole("button", { name: "+ Přidat do tréninku" }))
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(3))
    expect(api.post).toHaveBeenLastCalledWith("goal-trainings/session-2/steps", {
      json: {
        title: "Přivolání od jiného psa",
        instruction: "Začni s klidným psem v dostatečné vzdálenosti. Odměň návrat.",
        criterion: "Vrátí se na první povel i od druhého psa",
        durationMinutes: 10,
      },
    })
  })
  it("adds a persisted rest step", async () => {
    const user = userEvent.setup()
    mount()
    await user.click(screen.getByRole("button", { name: "Pauza" }))
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("goal-trainings/session-2/steps", {
        json: {
          title: "Pauza",
          instruction: "Nech psa odpočinout a nabídni mu vodu.",
          criterion: "Pes je připravený pokračovat.",
          durationMinutes: 2,
        },
      }),
    )
  })
  it("offers preview but no editing or scheduling for read-only history", () => {
    mount(true)
    expect(screen.queryByRole("button", { name: "Nový krok" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Z knihovny" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Naplánovat" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Náhled" })).toBeEnabled()
  })
})
