import type { AnchorHTMLAttributes, ReactElement } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

import type { CompleteTrainingInput } from "@/features/training/api/trainingSchemas"

import { FinishTrainingForm } from "./FinishTrainingForm"

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    },
  )
})

afterAll(() => {
  vi.unstubAllGlobals()
})

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a
      href={to}
      {...props}
    >
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}))

const defaultDog = {
  id: "d1",
  name: "Rex",
  hasTrainer: false,
}

const defaultGoal = {
  id: "g1",
  title: "Chůze u nohy",
}

function renderWithClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe("FinishTrainingForm", () => {
  it("persists chosen and custom mistake details only while repeated mistakes are Yes", async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn<(data: CompleteTrainingInput) => void>()
    renderWithClient(
      <FinishTrainingForm
        trainingId="t1"
        dog={defaultDog}
        goal={defaultGoal}
        onSubmit={handleSubmit}
        plannedDurationMinutes={25}
        stepCount={3}
      />,
    )
    expect(screen.getByText(/plán 25 min · 3 kroky plánu/)).toBeInTheDocument()
    const mistakes = screen.getByRole("radiogroup", { name: "Opakované chyby" })
    await user.click(within(mistakes).getByRole("radio", { name: "Ano" }))
    await user.click(screen.getByRole("button", { name: "Předbíhal" }))
    await user.click(screen.getByRole("button", { name: "+ vlastní" }))
    await user.type(screen.getByLabelText("Vlastní chyba"), "Padal do strany{Enter}")
    await user.click(screen.getByRole("button", { name: "Uložit záznam" }))
    expect(handleSubmit).toHaveBeenLastCalledWith({
      repeatedMistakes: "YES",
      mistakeDetails: ["Předbíhal", "Padal do strany"],
    })
    await user.click(within(mistakes).getByRole("radio", { name: "Ne" }))
    await user.click(screen.getByRole("button", { name: "Uložit záznam" }))
    expect(handleSubmit).toHaveBeenLastCalledWith({ repeatedMistakes: "NO" })
  })
  it("renders header, h1, controls and default empty state", () => {
    renderWithClient(
      <FinishTrainingForm
        trainingId="t1"
        dog={defaultDog}
        goal={defaultGoal}
      />,
    )

    expect(screen.getByText("Rex · Chůze u nohy")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 1, name: "Odcvičeno!" })).toBeInTheDocument()
    expect(screen.getByTestId("success-rate-value")).toHaveTextContent("— %")
    expect(screen.getByRole("button", { name: "Uložit záznam" })).toBeInTheDocument()
  })

  it("displays helper text for dog without a trainer", () => {
    renderWithClient(
      <FinishTrainingForm
        trainingId="t1"
        dog={{ ...defaultDog, hasTrainer: false }}
        goal={defaultGoal}
      />,
    )

    expect(
      screen.getByText("Všechna pole jsou volitelná. Záznam se uloží do deníku Rex."),
    ).toBeInTheDocument()
  })

  it("displays helper text for dog with a trainer", () => {
    renderWithClient(
      <FinishTrainingForm
        trainingId="t1"
        dog={{ ...defaultDog, hasTrainer: true }}
        goal={defaultGoal}
      />,
    )

    expect(
      screen.getByText("Všechna pole jsou volitelná. Záznam uvidí váš trenér u Rex."),
    ).toBeInTheDocument()
  })

  it("submits empty payload when fields are untouched (all fields optional)", async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn<(data: CompleteTrainingInput) => void>()

    renderWithClient(
      <FinishTrainingForm
        trainingId="t1"
        dog={defaultDog}
        goal={defaultGoal}
        onSubmit={handleSubmit}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Uložit záznam" }))

    expect(handleSubmit).toHaveBeenCalledTimes(1)
    expect(handleSubmit).toHaveBeenCalledWith({})
  })

  it("submits filled payload with slider, toggles, video URL and note", async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn<(data: CompleteTrainingInput) => void>()

    renderWithClient(
      <FinishTrainingForm
        trainingId="t1"
        dog={defaultDog}
        goal={defaultGoal}
        onSubmit={handleSubmit}
      />,
    )

    // Adjust slider using keyboard or fireEvent
    const slider = screen.getByRole("slider", { name: "Úspěšnost" })
    fireEvent.keyDown(slider, { key: "ArrowRight" })
    fireEvent.keyDown(slider, { key: "ArrowRight" })
    // Or set value directly
    expect(screen.getByTestId("success-rate-value")).not.toHaveTextContent("— %")

    // Choose focus "YES" (Ano)
    const focusGroup = screen.getByRole("radiogroup", { name: "Soustředění" })
    const focusYes = within(focusGroup).getByRole("radio", { name: "Ano" })
    await user.click(focusYes)

    // Choose repeated mistakes "NO" (Ne)
    const mistakeGroup = screen.getByRole("radiogroup", { name: "Opakované chyby" })
    const mistakeNo = within(mistakeGroup).getByRole("radio", { name: "Ne" })
    await user.click(mistakeNo)

    const videoInput = screen.getByLabelText("Odkaz na video")
    await user.type(videoInput, "  https://youtube.com/watch?v=abc  ")

    // Type note
    const textarea = screen.getByLabelText("Poznámka")
    await user.type(textarea, "  Skvělý trénink, pes byl šikovný.  ")

    // Submit
    await user.click(screen.getByRole("button", { name: "Uložit záznam" }))

    expect(handleSubmit).toHaveBeenCalledTimes(1)
    const payload = handleSubmit.mock.calls[0]?.[0]
    expect(payload?.successRate).toBeDefined()
    expect(payload?.focus).toBe("YES")
    expect(payload?.repeatedMistakes).toBe("NO")
    expect(payload?.videoUrl).toBe("https://youtube.com/watch?v=abc")
    expect(payload?.note).toBe("Skvělý trénink, pes byl šikovný.")
  })

  it("omits empty video URL from the payload", async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn<(data: CompleteTrainingInput) => void>()

    renderWithClient(
      <FinishTrainingForm
        trainingId="t1"
        dog={defaultDog}
        goal={defaultGoal}
        onSubmit={handleSubmit}
      />,
    )

    await user.type(screen.getByLabelText("Odkaz na video"), "   ")
    await user.click(screen.getByRole("button", { name: "Uložit záznam" }))

    expect(handleSubmit).toHaveBeenCalledWith({})
  })

  it("allows deselecting toggle items", async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn<(data: CompleteTrainingInput) => void>()

    renderWithClient(
      <FinishTrainingForm
        trainingId="t1"
        dog={defaultDog}
        goal={defaultGoal}
        onSubmit={handleSubmit}
      />,
    )

    const focusGroup = screen.getByRole("radiogroup", { name: "Soustředění" })
    const focusYes = within(focusGroup).getByRole("radio", { name: "Ano" })

    // Select
    await user.click(focusYes)
    expect(focusYes).toHaveAttribute("data-state", "on")

    // Deselect
    await user.click(focusYes)
    expect(focusYes).toHaveAttribute("data-state", "off")

    await user.click(screen.getByRole("button", { name: "Uložit záznam" }))
    expect(handleSubmit).toHaveBeenCalledWith({})
  })

  it("shows pending state with 'Ukládám…' and disabled button when submitting", () => {
    renderWithClient(
      <FinishTrainingForm
        trainingId="t1"
        dog={defaultDog}
        goal={defaultGoal}
        isPending={true}
      />,
    )

    const submitBtn = screen.getByRole("button", { name: "Ukládám…" })
    expect(submitBtn).toBeInTheDocument()
    expect(submitBtn).toBeDisabled()
  })
})
