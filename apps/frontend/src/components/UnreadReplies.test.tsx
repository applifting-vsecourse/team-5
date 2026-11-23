import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"
import { collapseUnreadReplies, type UnreadReply } from "@/lib/trainingReplies"

import { ReadReplyReceipt, RecordUnreadBadge, UnreadNavDot } from "./UnreadReplies"

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
    const rows = collapseUnreadReplies([
      plan("later", "2026-11-25"),
      plan("sooner", "2026-11-12"),
      reply,
    ])
    expect(rows.map((row) => row.id)).toEqual(["sooner", reply.id])
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
          training: { title: "Plan" },
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
