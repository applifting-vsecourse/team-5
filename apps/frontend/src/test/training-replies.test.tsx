import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { BottomNav } from "@/components/BottomNav/BottomNav"
import { api } from "@/lib/api-client"
import { replyKeys, type UnreadReply } from "@/lib/trainingReplies"

import { DogActivitiesSection } from "@/features/dog/components/DogActivitiesSection"
import {
  TrainingPlanReplyDialog,
  TrainingRecordDialog,
} from "@/features/dog/components/TrainingRecordDialog"
import { UnreadReplies } from "@/features/dog/components/UnreadReplies"
import { WeekView } from "@/features/week/components/WeekView"

vi.mock("@/lib/api-client", () => ({ api: { get: vi.fn(), post: vi.fn() } }))
vi.mock("@tanstack/react-router", () => ({
  useLocation: () => ({ pathname: "/dogs/dog" }),
  Link: ({ to, children, ...props }: React.PropsWithChildren<{ to: string }>) => (
    <a
      href={to}
      {...props}
    >
      {children}
    </a>
  ),
}))

const dog = { id: "dog", name: "Rex", color: 1 }
const activity = {
  id: "record",
  dogId: "dog",
  title: "Chůze v září",
  status: "COMPLETED",
  completedAt: "2026-09-10T10:00:00Z",
  messages: [
    {
      id: "message-1",
      text: "Zkuste kratší kroky.",
      createdAt: "2026-10-23T10:00:00Z",
      author: { id: "trainer", name: "Trenér" },
    },
  ],
  goalId: null,
  goal: null,
  isOwner: true,
  planChanged: false,
}
const makeReply = (id: string): UnreadReply => ({
  id,
  kind: "MESSAGE",
  createdAt: new Date(),
  workoutLog: {
    id: "record",
    title: activity.title,
    completedAt: new Date(activity.completedAt),
    dog,
  },
  scheduledTraining: null,
})
let pending: UnreadReply[]
let shouldFailDetail = false
let shouldFailRead = false
let shouldFailSend = false
let finishRead: (() => void) | undefined
let shouldDeferRead = false
const get = vi.mocked(api.get)
const post = vi.mocked(api.post)

beforeEach(() => {
  pending = [makeReply("reply-1")]
  shouldFailDetail = false
  shouldFailRead = false
  shouldFailSend = false
  shouldDeferRead = false
  finishRead = undefined
  vi.clearAllMocks()
  get.mockImplementation(((path: string) => ({
    json: async () => {
      await Promise.resolve()
      if (path === "training-replies") return [...pending]
      if (path === "dogs/dog/activities")
        return { items: [activity], total: 1, page: 1, pageSize: 3 }
      if (path === "dogs/dog/activities/record") {
        if (shouldFailDetail) throw new Error("offline")
        return {
          ...activity,
          unreadReplyIds: pending
            .filter((reply) => reply.workoutLog?.id === "record")
            .map((reply) => reply.id),
        }
      }
      if (path === "trainings") {
        return [
          {
            id: "training",
            date: "2026-10-23",
            status: "PLANNED",
            dog,
            goal: { id: "goal", title: "Chůze" },
            exercises: [],
          },
        ]
      }
      if (path === "trainings/training/reply") {
        return {
          id: "training",
          dog,
          goal: { id: "goal", title: "Chůze", principle: "Krátké kroky", blocks: [] },
          unreadReplyIds: pending.map((reply) => reply.id),
        }
      }
      throw new Error(`Unexpected GET ${path}`)
    },
  })) as typeof api.get)
  post.mockImplementation((async (
    path: string,
    options: { json: { replyIds?: string[]; text?: string } },
  ) => {
    if (path === "training-replies/read") {
      if (shouldDeferRead) {
        await new Promise<void>((resolve) => {
          finishRead = resolve
        })
      }
      if (shouldFailRead) throw new Error("offline")
      pending = pending.filter((reply) => !options.json.replyIds?.includes(reply.id))
    } else if (path.endsWith("/messages")) {
      if (shouldFailSend) throw new Error("offline")
    } else throw new Error(`Unexpected POST ${path}`)
    return new Response(null, { status: 204 })
  }) as typeof api.post)
})

function mount(children: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const rendered = render(<QueryClientProvider client={client}>{children}</QueryClientProvider>)
  return { ...rendered, client, user: userEvent.setup() }
}

describe("training reply badges", () => {
  it("lists badges without reading; opening a record clears them only after acknowledgement", async () => {
    shouldDeferRead = true
    const { user } = mount(
      <>
        <BottomNav />
        <DogActivitiesSection
          dogId="dog"
          dogName="Rex"
        />
      </>,
    )
    expect(await screen.findByText("nová odpověď")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Týden, nepřečtené odpovědi" })).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
    await user.click(
      screen.getByRole("button", { name: `Otevřít detail aktivity ${activity.title}` }),
    )
    expect(await screen.findByText("Zkuste kratší kroky.")).toBeInTheDocument()
    await waitFor(() => expect(finishRead).toBeDefined())
    expect(post).toHaveBeenCalledWith("training-replies/read", { json: { replyIds: ["reply-1"] } })
    expect(screen.getByText("nová odpověď")).toBeInTheDocument()
    act(() => {
      finishRead?.()
    })
    await waitFor(() => expect(screen.queryByText("nová odpověď")).not.toBeInTheDocument())
    expect(screen.queryByText("Nepřečtené odpovědi")).not.toBeInTheDocument()
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("keeps a reply arriving during acknowledgement unread until its record is fetched", async () => {
    shouldDeferRead = true
    const { client } = mount(
      <>
        <BottomNav />
        <TrainingRecordDialog
          dogId="dog"
          dogName="Rex"
          activityId="record"
          onClose={vi.fn()}
        />
      </>,
    )
    await waitFor(() => expect(finishRead).toBeDefined())
    pending.push(makeReply("reply-2"))
    act(() => {
      finishRead?.()
    })
    await waitFor(() => expect(pending.map((reply) => reply.id)).toEqual(["reply-2"]))
    expect(await screen.findByText("Nepřečtené odpovědi")).toBeInTheDocument()
    expect(post).toHaveBeenCalledTimes(1)
    shouldDeferRead = false
    await act(async () => {
      await client.invalidateQueries({ queryKey: replyKeys.record("dog", "record") })
    })
    await waitFor(() => expect(pending).toEqual([]))
    expect(post).toHaveBeenLastCalledWith("training-replies/read", {
      json: { replyIds: ["reply-2"] },
    })
  })

  it("does not clear a failed record load and provides retry", async () => {
    shouldFailDetail = true
    const { user } = mount(
      <TrainingRecordDialog
        dogId="dog"
        dogName="Rex"
        activityId="record"
        onClose={vi.fn()}
      />,
    )
    expect(await screen.findByText("Záznam se nepodařilo načíst.")).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
    expect(pending).toHaveLength(1)
    shouldFailDetail = false
    await user.click(screen.getByRole("button", { name: "Zkusit znovu" }))
    await waitFor(() => expect(pending).toHaveLength(0))
  })

  it("keeps badges after a failed read and retries without closing the record", async () => {
    shouldFailRead = true
    const { user } = mount(
      <>
        <BottomNav />
        <TrainingRecordDialog
          dogId="dog"
          dogName="Rex"
          activityId="record"
          onClose={vi.fn()}
        />
      </>,
    )
    expect(
      await screen.findByText("Odpověď se nepodařilo označit jako přečtenou."),
    ).toBeInTheDocument()
    expect(pending).toHaveLength(1)
    shouldFailRead = false
    await user.click(screen.getByRole("button", { name: "Zkusit znovu" }))
    await waitFor(() => expect(pending).toHaveLength(0))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("makes a reply to an older training reachable from Week", async () => {
    const { user } = mount(<UnreadReplies />)
    await user.click(
      await screen.findByRole("button", { name: /Rex · Chůze v září, nová odpověď/ }),
    )
    expect(await screen.findByText("Zkuste kratší kroky.")).toBeInTheDocument()
    await waitFor(() => expect(pending).toHaveLength(0))
  })

  it("opens a changed plan from its scheduled training and keeps it open after reading", async () => {
    pending = [
      {
        ...makeReply("plan-reply"),
        kind: "PLAN_CHANGED",
        workoutLog: null,
        scheduledTraining: {
          id: "training",
          date: new Date("2026-10-23"),
          dog,
          goal: { title: "Chůze" },
        },
      },
    ]
    function Week() {
      const [selected, setSelected] = useState<UnreadReply | null>(null)
      return (
        <>
          <WeekView
            weekStart="2026-10-19"
            today="2026-10-23"
            onWeekChange={vi.fn()}
            onReplyOpen={setSelected}
            replies={<UnreadReplies />}
          />
          {selected?.scheduledTraining && (
            <TrainingPlanReplyDialog
              trainingId={selected.scheduledTraining.id}
              onClose={() => setSelected(null)}
            />
          )}
        </>
      )
    }
    const { user } = mount(<Week />)
    await user.click(
      await screen.findByRole("button", { name: "Otevřít odpověď u tréninku Chůze" }),
    )
    expect(await screen.findByText("Krátké kroky")).toBeInTheDocument()
    await waitFor(() => expect(pending).toHaveLength(0))
    expect(screen.getByRole("dialog", { name: "Změna plánu" })).toBeInTheDocument()
  })

  it("validates replies and preserves an unsent message after failure", async () => {
    pending = []
    const { user } = mount(
      <TrainingRecordDialog
        dogId="dog"
        dogName="Rex"
        activityId="record"
        onClose={vi.fn()}
      />,
    )
    const input = await screen.findByLabelText("Zpráva k tréninku")
    await user.click(screen.getByRole("button", { name: "Odeslat zprávu" }))
    expect(screen.getByText("Napište zprávu.")).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
    await user.type(input, "Děkuji za radu.")
    shouldFailSend = true
    await user.click(screen.getByRole("button", { name: "Odeslat zprávu" }))
    expect(
      await screen.findByText("Zprávu se nepodařilo odeslat. Zkuste to znovu."),
    ).toBeInTheDocument()
    expect(input).toHaveValue("Děkuji za radu.")
    shouldFailSend = false
    await user.click(screen.getByRole("button", { name: "Odeslat zprávu" }))
    await waitFor(() => expect(input).toHaveValue(""))
  })
})
