import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type * as Router from "@tanstack/react-router"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { moveTraining } from "@/features/week/api/moveTraining"
import { skipTraining, undoSkip } from "@/features/week/api/skipTraining"
import { weekKeys, type WeekTraining } from "@/features/week/api/weekQueryOptions"

import { WeekView } from "./WeekView"

vi.mock("@/features/week/api/moveTraining", () => ({ moveTraining: vi.fn() }))
vi.mock("@/features/week/api/skipTraining", () => ({ skipTraining: vi.fn(), undoSkip: vi.fn() }))

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof Router>("@tanstack/react-router")
  return {
    ...actual,
    Link: ({
      to,
      params,
      children,
      ...props
    }: {
      to?: string
      params?: Record<string, string>
      children?: React.ReactNode
      [key: string]: unknown
    }) => {
      let href = to ?? "#"
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          href = href.replace(`$${key}`, value)
        })
      }
      return (
        <a
          href={href}
          {...props}
        >
          {children}
        </a>
      )
    },
  }
})

const aTraining = (overrides: Partial<WeekTraining> = {}): WeekTraining => ({
  id: "t1",
  date: "2026-10-21",
  status: "COMPLETED",
  dog: { id: "d1", name: "Rex", color: 1 },
  goal: { id: "g1", title: "Chůze u nohy" },
  exercises: [
    { id: "b1", title: "Sedni u nohy" },
    { id: "b2", title: "Krok vpřed" },
  ],
  ...overrides,
})

// Seed the cache so the week renders without hitting the API.
const renderWeek = (trainings: WeekTraining[], weekStart = "2026-10-19") => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  queryClient.setQueryData(weekKeys.week(weekStart), trainings)
  const onWeekChange = vi.fn()
  render(
    <QueryClientProvider client={queryClient}>
      <WeekView
        weekStart={weekStart}
        today="2026-10-21"
        onWeekChange={onWeekChange}
      />
    </QueryClientProvider>,
  )
  return { onWeekChange }
}

describe("WeekView", () => {
  it("shows today's trainings with dog, goal, status and exercises", () => {
    renderWeek([
      aTraining(),
      aTraining({
        id: "t2",
        status: "PLANNED",
        dog: { id: "d2", name: "Bella", color: 3 },
        goal: { id: "g2", title: "Hledání pamlsků" },
        exercises: [{ id: "b3", title: "Čuchej" }],
      }),
    ])

    expect(screen.getByText("19.–25. října")).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /^středa 21\. 10\., dnes/ })).toBeChecked()
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("středa 21. 10. · dnes")

    const [rex, bella] = screen.getAllByRole("listitem")
    if (!rex || !bella) throw new Error("expected two training cards")
    expect(within(rex).getByRole("heading", { name: "Rex · Chůze u nohy" })).toBeInTheDocument()
    expect(within(rex).getByText("Odcvičeno")).toBeInTheDocument()
    expect(within(rex).getByText("2 cviky · Sedni u nohy, Krok vpřed")).toBeInTheDocument()
    expect(within(rex).queryByRole("link")).not.toBeInTheDocument()
    expect(within(bella).getByText("Naplánováno")).toBeInTheDocument()
    expect(within(bella).getByText("1 cvik · Čuchej")).toBeInTheDocument()
    expect(
      within(bella).getByRole("link", { name: "Trénink Bella · Hledání pamlsků" }),
    ).toHaveAttribute("href", "/trainings/t2")
  })

  it("marks the days that have a training", () => {
    renderWeek([aTraining(), aTraining({ id: "t2", date: "2026-10-24" })])

    expect(screen.getByRole("radio", { name: /sobota 24\. 10\., tréninků: 1/ })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: "čtvrtek 22. 10." })).toBeInTheDocument()
  })

  it("switches to another day", async () => {
    const user = userEvent.setup()
    renderWeek([aTraining()])

    await user.click(screen.getByRole("radio", { name: "čtvrtek 22. 10." }))

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("čtvrtek 22. 10.")
    expect(screen.getByText("Na tento den nemáte nic naplánováno.")).toBeInTheDocument()
  })

  it("moves a week back and forth with the arrows (#73)", async () => {
    const user = userEvent.setup()
    const { onWeekChange } = renderWeek([])

    await user.click(screen.getByRole("button", { name: "Předchozí týden" }))
    await user.click(screen.getByRole("button", { name: "Další týden" }))

    expect(onWeekChange).toHaveBeenNthCalledWith(1, "2026-10-12")
    expect(onWeekChange).toHaveBeenNthCalledWith(2, "2026-10-26")
  })

  it("offers 'Dnes' only away from the current week (#73)", () => {
    renderWeek([])
    expect(screen.getByRole("button", { name: "Dnes" })).toBeDisabled()
  })

  it("returns to the current week with 'Dnes' and starts another week on Monday", async () => {
    const user = userEvent.setup()
    const { onWeekChange } = renderWeek([], "2026-11-02")

    expect(screen.getByText("2.–8. listopadu")).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /^pondělí 2\. 11\./ })).toBeChecked()

    await user.click(screen.getByRole("button", { name: "Dnes" }))
    expect(onWeekChange).toHaveBeenCalledWith("2026-10-19")
  })

  it("says what to do when the whole week is empty", () => {
    renderWeek([])

    expect(screen.getByText(/Na tento týden nemáte nic naplánováno/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Přejít na psy" })).toHaveAttribute("href", "/dogs")
  })


  it("picks the whole week of any day in the month calendar behind the week range", async () => {
    const user = userEvent.setup()
    const { onWeekChange } = renderWeek([])

    await user.click(screen.getByRole("button", { name: /^Vybrat týden/ }))
    const dialog = screen.getByRole("dialog", { name: "Vybrat týden" })

    // Wednesday 7 October lies in the week of Monday 5 October.
    await user.click(within(dialog).getByRole("button", { name: "středa, 7. října 2026" }))

    expect(onWeekChange).toHaveBeenCalledWith("2026-10-05")
  })


  describe("moving a training (#74)", () => {
    beforeEach(() => {
      // Wednesday 21 Oct 2026, the same day as the week's "today".
      vi.useFakeTimers({ toFake: ["Date"] })
      vi.setSystemTime(new Date(2026, 9, 21, 10, 0))
      vi.mocked(moveTraining).mockReset()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("offers 'Přesunout' only on a planned training", () => {
      renderWeek([
        aTraining({ id: "t1", status: "PLANNED" }),
        aTraining({ id: "t2", status: "COMPLETED", goal: { id: "g2", title: "Pac" } }),
      ])

      expect(
        screen.getByRole("button", { name: "Přesunout trénink Rex · Chůze u nohy" }),
      ).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "Přesunout trénink Rex · Pac" })).toBeNull()
      // The card still opens the walkthrough (#76).
      expect(screen.getByRole("link", { name: "Trénink Rex · Chůze u nohy" })).toHaveAttribute(
        "href",
        "/trainings/t1",
      )
    })

    it("moves the training to a day in the next week", async () => {
      const user = userEvent.setup()
      vi.mocked(moveTraining).mockResolvedValue({
        id: "t1",
        goalId: "g1",
        dogId: "d1",
        date: "2026-10-27",
      })
      renderWeek([aTraining({ status: "PLANNED" })])

      await user.click(screen.getByRole("button", { name: /^Přesunout trénink/ }))
      const dialog = screen.getByRole("dialog", { name: "Přesunout trénink" })
      // The day it is on now cannot be picked, so tomorrow is offered first.
      expect(within(dialog).getByRole("radio", { name: "středa 21. 10." })).toBeDisabled()
      expect(within(dialog).getByRole("radio", { name: "čtvrtek 22. 10." })).toBeChecked()

      await user.click(within(dialog).getByRole("button", { name: "Další týden" }))
      await user.click(within(dialog).getByRole("radio", { name: "úterý 27. 10." }))
      await user.click(within(dialog).getByRole("button", { name: "Přesunout na úterý 27. 10." }))

      expect(moveTraining).toHaveBeenCalledWith("t1", "2026-10-27")
      expect(screen.queryByRole("dialog")).toBeNull()
    })

    it("keeps the dialog open when the move fails", async () => {
      const user = userEvent.setup()
      vi.mocked(moveTraining).mockRejectedValue(new Error("offline"))
      renderWeek([aTraining({ status: "PLANNED" })])

      await user.click(screen.getByRole("button", { name: /^Přesunout trénink/ }))
      await user.click(screen.getByRole("button", { name: "Přesunout na čtvrtek 22. 10." }))

      expect(screen.getByRole("dialog", { name: "Přesunout trénink" })).toBeInTheDocument()
    })
  })

  describe("skipping a training (#75)", () => {
    const skipped = {
      id: "t1",
      goalId: "g1",
      dogId: "d1",
      date: "2026-10-21",
      status: "SKIPPED" as const,
    }

    beforeEach(() => {
      vi.mocked(skipTraining).mockReset()
      vi.mocked(undoSkip).mockReset()
    })

    it("skips a planned training after confirmation", async () => {
      const user = userEvent.setup()
      vi.mocked(skipTraining).mockResolvedValue(skipped)
      renderWeek([aTraining({ status: "PLANNED" })])

      await user.click(screen.getByRole("button", { name: /^Přeskočit trénink/ }))
      const dialog = screen.getByRole("alertdialog", { name: "Přeskočit trénink?" })
      expect(dialog).toHaveTextContent("plán cíle se neposune")

      await user.click(within(dialog).getByRole("button", { name: "Přeskočit" }))

      expect(skipTraining).toHaveBeenCalledWith("t1")
    })

    it("does not skip when the user keeps the training", async () => {
      const user = userEvent.setup()
      renderWeek([aTraining({ status: "PLANNED" })])

      await user.click(screen.getByRole("button", { name: /^Přeskočit trénink/ }))
      await user.click(screen.getByRole("button", { name: "Ponechat" }))

      expect(skipTraining).not.toHaveBeenCalled()
      expect(screen.queryByRole("alertdialog")).toBeNull()
    })

    it("keeps a skipped training in the week and lets the user take the skip back", async () => {
      const user = userEvent.setup()
      vi.mocked(undoSkip).mockResolvedValue({ ...skipped, status: "PLANNED" })
      renderWeek([aTraining({ status: "SKIPPED" })])

      expect(screen.getByText("Přeskočeno")).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: /^Přeskočit trénink/ })).toBeNull()

      await user.click(
        screen.getByRole("button", { name: "Vrátit přeskočení tréninku Rex · Chůze u nohy" }),
      )

      expect(undoSkip).toHaveBeenCalledWith("t1")
    })

    it("does not offer to take back a skip from a past week", () => {
      renderWeek([aTraining({ date: "2026-10-14", status: "SKIPPED" })], "2026-10-12")

      expect(screen.queryByRole("button", { name: /^Vrátit přeskočení/ })).toBeNull()
    })

    it("offers no action on a completed training", () => {
      renderWeek([aTraining({ status: "COMPLETED" })])

      expect(screen.queryByRole("button", { name: /^Přeskočit trénink/ })).toBeNull()
      expect(screen.queryByRole("button", { name: /^Vrátit přeskočení/ })).toBeNull()
    })

  })
})
