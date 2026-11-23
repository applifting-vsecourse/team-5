import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor, within } from "@testing-library/react"
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
} as DogGoal
const aStep = (id: string, title: string, parentId: string | null = null) =>
  ({
    id,
    goalId: goal.id,
    parentId,
    position: 0,
    title,
    instruction: null,
    criterion: null,
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
    // Desktop library is always mounted (jsdom ignores Tailwind `hidden`); pick the first match.
    await user.click(screen.getAllByRole("button", { name: /Přivolání na píšťalku/ })[0]!)
    await user.click(screen.getAllByRole("button", { name: /Přivolání od jiného psa/ })[0]!)
    await user.click(screen.getAllByRole("button", { name: "+ Přidat do tréninku" })[0]!)
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
    await user.click(screen.getAllByRole("button", { name: "+ Přidat do tréninku" })[0]!)
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
  it("shows the desktop library panel and owner preview for the current steps", async () => {
    const user = userEvent.setup()
    const withSteps: TrainingSession = {
      ...session,
      steps: [aStep("s1", "Kontakt"), aStep("s2", "Volně"), aStep("c1", "Kousek", "s1")],
    }
    mount(false, { session: withSteps })
    expect(screen.getByRole("heading", { name: "Knihovna kroků" })).toBeInTheDocument()
    const preview = screen.getByRole("complementary", { name: "Náhled pro psovoda" })
    // Same order as the walkthrough on Dnes: sub-steps before their parent (#174, #162).
    expect(
      within(preview)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["1Kousek", "2Kontakt", "3Volně"])
    expect(screen.queryByText("Uloženo automaticky")).not.toBeInTheDocument()

    await user.click(within(preview).getByRole("button", { name: "Začít trénink" }))
    expect(screen.getByRole("dialog", { name: "Náhled psovoda" })).toBeInTheDocument()
  })
  it("offers preview but no editing or scheduling for read-only history", () => {
    mount(true)
    expect(screen.queryByRole("button", { name: "Nový krok" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Z knihovny" })).not.toBeInTheDocument()
    // Desktop + mobile action bars both mount; jsdom does not apply Tailwind `hidden`.
    expect(
      screen
        .getAllByRole("button", { name: "Naplánovat" })
        .every((b) => b.hasAttribute("disabled")),
    ).toBe(true)
    expect(
      screen.getAllByRole("button", { name: "Náhled" }).some((b) => !b.hasAttribute("disabled")),
    ).toBe(true)
  })
  it("renders steps without current-step controls or duplicated goal principle", () => {
    const withSteps: TrainingSession = {
      ...session,
      steps: [aStep("s1", "Kontakt"), aStep("s2", "Volně")],
    }
    mount(false, { session: withSteps })
    // Step titles also appear in the desktop owner preview.
    expect(screen.getAllByText("Kontakt").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Volně").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Princip tréninku")).toHaveLength(1)
    expect(screen.queryByText("Aktuální")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Zvládnuto, další krok" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Přeskočit" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Zpět o krok" })).not.toBeInTheDocument()
  })
  it("lets a root step split into indented sub-steps (#67)", async () => {
    const user = userEvent.setup()
    const withSteps: TrainingSession = {
      ...session,
      steps: [aStep("s1", "Sedni – zůstaň"), aStep("s1a", "Sedni 5 s", "s1")],
    }
    mount(false, { session: withSteps })
    // Step titles also appear in the desktop owner preview.
    expect(
      screen
        .getAllByText("Sedni 5 s")
        .some((node) => node.closest("li")?.classList.contains("ml-6")),
    ).toBe(true)
    await user.click(screen.getByRole("button", { name: "Upravit krok Sedni – zůstaň" }))
    expect(screen.getByRole("button", { name: "Přidat dílčí krok" })).toBeEnabled()
    await user.click(screen.getByRole("button", { name: "Přidat dílčí krok" }))
    expect(screen.getByRole("region", { name: "Dílčí krok" })).toBeInTheDocument()
    await user.type(screen.getByLabelText("Název kroku"), "Sedni 10 s")
    await user.click(screen.getByRole("button", { name: "Přidat krok" }))
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("goal-trainings/session-2/steps", {
        json: {
          title: "Sedni 10 s",
          instruction: "",
          criterion: "",
          durationMinutes: 5,
          parentId: "s1",
        },
      }),
    )
  })
  it("does not offer split on a sub-step", async () => {
    const user = userEvent.setup()
    const withSteps: TrainingSession = {
      ...session,
      steps: [aStep("s1", "Sedni"), aStep("s1a", "Sedni 5 s", "s1")],
    }
    mount(false, { session: withSteps })
    await user.click(screen.getByRole("button", { name: "Upravit krok Sedni 5 s" }))
    expect(screen.queryByRole("button", { name: "Přidat dílčí krok" })).not.toBeInTheDocument()
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
  it("notifies plan save and offers return to the training record", async () => {
    const user = userEvent.setup()
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    // Keep this test focused on the save callback rather than network refresh.
    vi.spyOn(client, "invalidateQueries").mockResolvedValue()
    const onPlanSaved = vi.fn()
    const onReturnToRecord = vi.fn()
    const view = (hasSaved: boolean) => (
      <QueryClientProvider client={client}>
        <SessionEditor
          session={session}
          sessions={[session]}
          dog={dog}
          goal={goal}
          isReadOnly={false}
          onBack={vi.fn()}
          hasSavedPlanChanges={hasSaved}
          onPlanSaved={onPlanSaved}
          onReturnToRecord={onReturnToRecord}
        />
      </QueryClientProvider>
    )
    const { rerender } = render(view(false))
    await user.click(screen.getByRole("button", { name: "Pauza" }))
    await waitFor(() => expect(onPlanSaved).toHaveBeenCalledOnce())
    rerender(view(true))
    await user.click(screen.getByRole("button", { name: "Hotovo, zpět na záznam" }))
    expect(onReturnToRecord).toHaveBeenCalledOnce()
  })
})
