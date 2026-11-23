import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"
import { collapseUnreadReplies, type UnreadReply } from "@/lib/trainingReplies"

import { ReadReplyReceipt, RecordUnreadBadge, UnreadNavDot, UnreadReplyList } from "./UnreadReplies"

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    params,
    children,
  }: {
    to: string
    params?: Record<string, string>
    children: React.ReactNode
  }) => {
    let href = to
    if (params) {
      for (const [key, value] of Object.entries(params)) href = href.replace(`$${key}`, value)
    }
    return <a href={href}>{children}</a>
  },
}))

vi.mock("@/lib/api-client", () => ({ api: { get: vi.fn(), post: vi.fn() } }))
const reply: UnreadReply = {
  id: "receipt-1",
  kind: "MESSAGE",
  createdAt: new Date(),
  workoutLog: { id: "record-1", title: "Přivolání", dog: { id: "dog-1", name: "Rex", color: 1 } },
  scheduledTraining: null,
}
function wrap(ui: React.ReactNode, replies = [reply]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
  })
  client.setQueryData(["unread-training-replies"], replies)
  return { client, ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>) }
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.get).mockReturnValue({ json: () => Promise.resolve([]) } as never)
  vi.mocked(api.post).mockResolvedValue({} as never)
})
describe("collapseUnreadReplies", () => {
  it("keeps one row for the same plan changed on several days", () => {
    const dog = { id: "dog-1", name: "Rex", color: 1 }
    const plan = (id: string, day: string): UnreadReply => ({
      id,
      kind: "PLAN_CHANGED",
      createdAt: new Date(day),
      workoutLog: null,
      scheduledTraining: {
        id,
        date: new Date(day),
        training: { id: "template", title: "Start na povel" },
        dog,
        workoutLog: null,
      },
    })
    const today = "2026-11-23"
    expect(
      collapseUnreadReplies(
        [plan("later", "2026-11-25"), plan("sooner", "2026-11-12"), reply],
        today,
      ).map((row) => row.id),
    ).toEqual(["later", reply.id])
    expect(
      collapseUnreadReplies([plan("later", "2026-11-01"), plan("sooner", "2026-10-20")], today).map(
        (row) => row.id,
      ),
    ).toEqual(["sooner"])
  })
  it("keeps two plans that share a title", () => {
    const dog = { id: "dog-1", name: "Rex", color: 1 }
    const plan = (id: string, templateId: string): UnreadReply => ({
      id,
      kind: "PLAN_CHANGED",
      createdAt: new Date("2026-11-23"),
      workoutLog: null,
      scheduledTraining: {
        id,
        date: new Date("2026-11-25"),
        training: { id: templateId, title: "Start na povel" },
        dog,
        workoutLog: null,
      },
    })
    expect(collapseUnreadReplies([plan("a", "template-a"), plan("b", "template-b")])).toHaveLength(2)
  })
  it("opens the training for a changed plan even when that day already has a record", () => {
    wrap(<UnreadReplyList />, [
      {
        id: "plan-1",
        kind: "PLAN_CHANGED",
        createdAt: new Date("2026-11-12"),
        workoutLog: null,
        scheduledTraining: {
          id: "session-1",
          date: new Date("2026-11-12"),
          training: { id: "template", title: "Start na povel" },
          dog: { id: "dog-1", name: "Rex", color: 1 },
          workoutLog: { id: "record-9" },
        },
      },
    ])
    expect(screen.getByRole("link", { name: /Start na povel/ })).toHaveAttribute(
      "href",
      "/trainings/session-1",
    )
  })
})
describe("unread training replies", () => {
  it("shows a text badge only on the matching record and a navigation indicator", () => {
    wrap(
      <>
        <RecordUnreadBadge activityId="other" />
        <RecordUnreadBadge activityId="record-1" />
        <UnreadNavDot />
      </>,
    )
    expect(screen.getAllByText("nová odpověď")).toHaveLength(1)
    expect(screen.getByText("Nové odpovědi")).toBeInTheDocument()
  })
  it("keeps a scheduled notification linked to its completed record", () => {
    wrap(<RecordUnreadBadge activityId="completed" />, [
      {
        ...reply,
        workoutLog: null,
        scheduledTraining: {
          id: "session",
          date: new Date(),
          training: { id: "plan", title: "Plan" },
          dog: reply.workoutLog!.dog,
          workoutLog: { id: "completed" },
        },
      },
    ])
    expect(screen.getByText("nová odpověď")).toBeInTheDocument()
  })
  it("acknowledges the displayed snapshot without consuming a late reply", async () => {
    const { client } = wrap(<ReadReplyReceipt ids={["snapshot"]} />)
    client.setQueryData(["unread-training-replies"], [reply, { ...reply, id: "late" }])
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("training-replies/read", {
        json: { ids: ["snapshot"] },
      }),
    )
    expect(api.post).toHaveBeenCalledTimes(1)
  })
  it("preserves unread data after failure and offers an explicit retry", async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error("offline"))
    const { client } = wrap(<ReadReplyReceipt ids={[reply.id]} />)
    await screen.findByRole("alert")
    expect(client.getQueryData(["unread-training-replies"])).toEqual([reply])
    await userEvent.click(screen.getByRole("button", { name: "Zkusit znovu" }))
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(2))
  })
})
