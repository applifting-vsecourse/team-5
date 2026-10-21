import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { GoalForm } from "./GoalForm"

describe("GoalForm", () => {
  it("submits title, the dog's discipline and the principle", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <GoalForm
        disciplines={["Poslušnost", "Canicross"]}
        isPending={false}
        onSubmit={onSubmit}
      />,
    )

    await user.type(screen.getByLabelText("Název cíle"), "  Spolehlivá chůze u nohy  ")
    await user.type(screen.getByLabelText("Princip"), "Pes jde u levé nohy.")
    await user.click(screen.getByRole("button", { name: "Uložit" }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        {
          title: "Spolehlivá chůze u nohy",
          discipline: "Poslušnost",
          principle: "Pes jde u levé nohy.",
        },
        expect.anything(),
      )
    })
  })

  it("explains the principle field", () => {
    render(
      <GoalForm
        disciplines={["Poslušnost"]}
        isPending={false}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByText("Čeho docílit a na co si dát pozor.")).toBeInTheDocument()
  })

  it("shows a message under the title when it is missing", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <GoalForm
        disciplines={["Poslušnost"]}
        isPending={false}
        onSubmit={onSubmit}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Uložit" }))

    expect(await screen.findByText("Název cíle je povinný")).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("saves without a discipline when the dog has none", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <GoalForm
        disciplines={[]}
        isPending={false}
        onSubmit={onSubmit}
      />,
    )

    expect(screen.queryByText("Disciplína")).not.toBeInTheDocument()
    expect(screen.getByText(/nemá žádnou disciplínu/)).toBeInTheDocument()

    await user.type(screen.getByLabelText("Název cíle"), "Pac")
    await user.click(screen.getByRole("button", { name: "Uložit" }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        { title: "Pac", discipline: "", principle: "" },
        expect.anything(),
      )
    })
  })

  it("keeps the goal's discipline even if the dog no longer lists it", () => {
    render(
      <GoalForm
        disciplines={["Canicross"]}
        defaultValues={{ title: "Pac", discipline: "Poslušnost", principle: "" }}
        isPending={false}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByRole("combobox")).toHaveTextContent("Poslušnost")
  })

  it("disables the submit button while saving", () => {
    render(
      <GoalForm
        disciplines={["Poslušnost"]}
        isPending
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByRole("button", { name: "Uložit" })).toBeDisabled()
  })
})
