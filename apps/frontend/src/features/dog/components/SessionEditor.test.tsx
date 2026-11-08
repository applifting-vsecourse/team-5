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
vi.mock("./SessionScheduleSheet", () => ({
  SessionScheduleSheet: ({
    isOpen,
    onOpenChange,
  }: {
    isOpen: boolean
    onOpenChange: (isOpen: boolean) => void
  }) => (isOpen ? <button onClick={() => onOpenChange(false)}>Zavřít plánování</button> : null),
}))
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
  status: "ACTIVE",
  currentStepId: null,
} as DogGoal
const aStep = (id: string, title: string, outcome: "MASTERED" | "SKIPPED" | null = null) =>
  ({
    id,
    goalId: goal.id,
    position: 0,
    title,
    instruction: null,
    criterion: null,
    outcome,
    durationMinutes: 5,
    createdAt: new Date("2026-11-01T10:00:00Z"),
    updatedAt: new Date("2026-11-01T10:00:00Z"),
  }) as TrainingSession["steps"][number]
const session: TrainingSession = {
  id: "session-2",
  goalId: goal.id,
  title: "Přivolání v parku",
  position: 1,
  isArchived: false,
  steps: [],
}
const mount = (
  isReadOnly = false,
  options: {
    session?: TrainingSession
    sessions?: TrainingSession[]
    canMoveStep?: boolean
    currentStepId?: string | null
  } = {},
) => {
  const activeSession = options.session ?? session
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        })
      }
    >
      <SessionEditor
        session={activeSession}
        sessions={options.sessions ?? [activeSession]}
        dog={dog}
        goal={goal}
        isReadOnly={isReadOnly}
        canMoveStep={options.canMoveStep}
        currentStepId={options.currentStepId}
        onBack={vi.fn()}
      />
    </QueryClientProvider>,
  )
}

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
  it("marks the current step and moves it via current-step API", async () => {
    const user = userEvent.setup()
    vi.mocked(api.post).mockImplementation(
      () =>
        ({
          json: () => Promise.resolve({ id: "goal-1", dogId: "dog-1", currentStepId: "s3" }),
        }) as ReturnType<typeof api.post>,
    )
    const withSteps: TrainingSession = {
      ...session,
      steps: [aStep("s1", "Kontakt", "MASTERED"), aStep("s2", "Volně")],
    }
    mount(false, {
      session: withSteps,
      canMoveStep: true,
      currentStepId: "s2",
    })
    expect(screen.getByText("Aktuální")).toBeInTheDocument()
    expect(screen.getByText("Zvládnuto")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Zvládnuto, další krok" })).toBeEnabled()
    await user.click(screen.getByRole("button", { name: "Zvládnuto, další krok" }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("goals/goal-1/current-step/advance"))
  })
  it("hides move actions when the session does not hold the current step", () => {
    const withSteps: TrainingSession = {
      ...session,
      steps: [aStep("s1", "Kontakt"), aStep("s2", "Volně")],
    }
    mount(false, {
      session: withSteps,
      canMoveStep: true,
      currentStepId: "other-training-step",
    })
    expect(screen.queryByText("Aktuální")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Zvládnuto, další krok" })).not.toBeInTheDocument()
  })
  it("opens scheduling when a request arrives without remounting the editor", async () => {
    const user = userEvent.setup()
    const client = new QueryClient()
    const handled = vi.fn()
    const view = (isScheduleRequested: boolean) => (
      <QueryClientProvider client={client}>
        <SessionEditor
          session={session}
          sessions={[session]}
          dog={dog}
          goal={goal}
          isReadOnly={false}
          onBack={vi.fn()}
          isScheduleRequested={isScheduleRequested}
          onScheduleRequestHandled={handled}
        />
      </QueryClientProvider>
    )
    const { rerender } = render(view(false))
    expect(screen.queryByRole("button", { name: "Zavřít plánování" })).not.toBeInTheDocument()
    rerender(view(true))
    await user.click(screen.getByRole("button", { name: "Zavřít plánování" }))
    expect(handled).toHaveBeenCalledOnce()
    rerender(view(false))
    expect(screen.queryByRole("button", { name: "Zavřít plánování" })).not.toBeInTheDocument()
  })
})
