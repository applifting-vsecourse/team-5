import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"

import { ClientScheduleFlow } from "./ClientScheduleFlow"

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    params,
    search,
  }: {
    children: React.ReactNode
    to: string
    params: Record<string, string>
    search?: Record<string, unknown>
  }) => (
    <a
      href={
        to.replace("$dogId", params.dogId ?? "").replace("$goalId", params.goalId ?? "") +
        (search?.novyTrenink ? "?novyTrenink=true" : "")
      }
    >
      {children}
    </a>
  ),
}))
vi.mock("@/lib/api-client", () => ({ api: { get: vi.fn() } }))
vi.mock("@/features/dog/components/EditorSheet", () => ({
  EditorSheet: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  ),
}))
vi.mock("@/features/dog/components/SessionScheduleSheet", () => ({
  SessionScheduleSheet: ({
    sessionId,
    goalId,
    dogId,
    onBack,
    description,
  }: {
    sessionId: string
    goalId: string
    dogId: string
    onBack: () => void
    description: string
  }) => (
    <div>
      <p>
        Kalendář {dogId} {goalId} {sessionId}
      </p>
      <p>{description}</p>
      <button onClick={onBack}>Změnit cíl nebo trénink</button>
    </div>
  ),
}))
const client = {
  id: "client",
  name: "Jana",
  email: "jana@example.test",
  createdAt: new Date(),
  dogs: [
    { id: "rex", name: "Rex", color: 1 },
    { id: "bara", name: "Bára", color: 2 },
  ],
}
const goal = (id: string, title: string) => ({
  id,
  title,
  criterion: null,
  principle: null,
  status: "ACTIVE",
  sessions: [
    {
      id: `${id}-training`,
      goalId: id,
      title: "Trénink",
      position: 0,
      isArchived: false,
      steps: [],
    },
  ],
})
function renderFlow(dogs = client.dogs) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <ClientScheduleFlow
        client={{ ...client, dogs }}
        onClose={vi.fn()}
      />
    </QueryClientProvider>,
  )
}
describe("ClientScheduleFlow", () => {
  beforeEach(() => vi.clearAllMocks())
  it("selects the requested dog and goal before opening its training calendar", async () => {
    vi.mocked(api.get).mockReturnValue({
      json: () =>
        Promise.resolve([
          {
            id: "discipline",
            isArchived: false,
            discipline: { id: "agility", name: "Agility" },
            goals: [goal("g1", "Skoky"), goal("g2", "Slalom")],
          },
        ]),
    } as unknown as ReturnType<typeof api.get>)
    const user = userEvent.setup()
    renderFlow()
    expect(api.get).not.toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: "Bára" }))
    await user.click(await screen.findByRole("button", { name: "Slalom" }))
    expect(api.get).toHaveBeenCalledWith("dogs/bara/plan")
    await user.click(screen.getByRole("button", { name: "Vybrat termíny" }))
    expect(screen.getByText("Kalendář bara g2 g2-training")).toBeInTheDocument()
  })
  it("shows the training summary and creation action even for single choices", async () => {
    vi.mocked(api.get).mockReturnValue({
      json: () =>
        Promise.resolve([
          {
            id: "discipline",
            isArchived: false,
            discipline: { id: "a", name: "Agility" },
            goals: [goal("g1", "Skoky")],
          },
        ]),
    } as unknown as ReturnType<typeof api.get>)
    const user = userEvent.setup()
    renderFlow(client.dogs.slice(0, 1))
    expect(await screen.findByText("Trénink")).toBeInTheDocument()
    expect(screen.queryByText(/Kalendář/)).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Vytvořit nový trénink" })).toHaveAttribute(
      "href",
      "/dogs/rex/goals/g1?novyTrenink=true",
    )
    await user.click(screen.getByRole("button", { name: "Vybrat termíny" }))
    expect(screen.getByText("Kalendář rex g1 g1-training")).toBeInTheDocument()
    expect(screen.getByText("Rex · Skoky · Trénink")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Změnit cíl nebo trénink" }))
    expect(screen.getByRole("link", { name: "Vytvořit nový trénink" })).toBeInTheDocument()
  })
  it("lets the user retry a failed plan request", async () => {
    vi.mocked(api.get).mockReturnValue({
      json: () => Promise.reject(new Error("offline")),
    } as unknown as ReturnType<typeof api.get>)
    renderFlow(client.dogs.slice(0, 1))
    expect(await screen.findByRole("button", { name: /Zkusit znovu/i })).toBeInTheDocument()
    expect(screen.queryByText(/Kalendář/)).not.toBeInTheDocument()
  })
})
