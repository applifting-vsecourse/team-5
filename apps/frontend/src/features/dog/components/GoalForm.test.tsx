import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { GoalForm } from "./GoalForm"

describe("GoalForm", () => {
  it.each(["save", "save with schedule available", "schedule"])(
    "blocks %s until the new discipline has been selected",
    async (mode) => {
      const user = userEvent.setup()
      let resolveAdd!: () => void
      const adding = new Promise<void>((resolve) => {
        resolveAdd = resolve
      })
      const onSubmit = vi.fn()
      const onSchedule = vi.fn()
      render(
        <GoalForm
          disciplines={["Poslušnost"]}
          defaultValues={{ title: "Slalom" }}
          isPending={false}
          onAddDiscipline={() => adding}
          onSubmit={onSubmit}
          onSubmitAndSchedule={mode === "save" ? undefined : onSchedule}
        />,
      )
      await user.click(screen.getByRole("button", { name: "Nová disciplína" }))
      await user.type(screen.getByLabelText("Nová disciplína"), "Agility")
      await user.click(screen.getByRole("button", { name: "Přidat" }))

      const save = screen.getByRole("button", { name: "Uložit" })
      expect(save).toBeDisabled()
      if (mode !== "save") {
        expect(screen.getByRole("button", { name: "Uložit a naplánovat" })).toBeDisabled()
      }
      // Direct form submission must also be guarded, not just button clicks.
      fireEvent.submit(save.closest("form")!)
      await user.type(screen.getByLabelText("Název cíle"), "{Enter}")
      expect(onSubmit).not.toHaveBeenCalled()
      expect(onSchedule).not.toHaveBeenCalled()

      await act(async () => {
        resolveAdd()
        await adding
      })
      expect(screen.getByRole("combobox")).toHaveTextContent("Agility")
      await user.click(
        mode === "schedule" ? screen.getByRole("button", { name: "Uložit a naplánovat" }) : save,
      )
      await waitFor(() =>
        expect(mode === "schedule" ? onSchedule : onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ discipline: "Agility" }),
          expect.anything(),
        ),
      )
    },
  )

  it("unlocks saving after discipline creation fails without changing the selection", async () => {
    const user = userEvent.setup()
    let rejectAdd!: (error: Error) => void
    const adding = new Promise<void>((_, reject) => {
      rejectAdd = reject
    })
    const onSubmit = vi.fn()
    render(
      <GoalForm
        disciplines={["Poslušnost"]}
        defaultValues={{ title: "Slalom" }}
        isPending={false}
        onAddDiscipline={() => adding}
        onSubmit={onSubmit}
      />,
    )
    await user.click(screen.getByRole("button", { name: "Nová disciplína" }))
    await user.type(screen.getByLabelText("Nová disciplína"), "Agility")
    await user.click(screen.getByRole("button", { name: "Přidat" }))
    await act(async () => {
      rejectAdd(new Error("Network failure"))
      await adding.catch(() => undefined)
    })
    expect(screen.getByText("Disciplínu se nepodařilo přidat. Zkus to znovu.")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Uložit" }))
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ discipline: "Poslušnost" }),
        expect.anything(),
      ),
    )
  })

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

  it("allows adding a new discipline inline and selects it for submission", async () => {
    const user = userEvent.setup()
    const onAddDiscipline = vi.fn().mockResolvedValue(undefined)
    const onSubmit = vi.fn()
    render(
      <GoalForm
        disciplines={[]}
        isPending={false}
        onAddDiscipline={onAddDiscipline}
        onSubmit={onSubmit}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Nová disciplína" }))
    await user.type(screen.getByLabelText("Nová disciplína"), "Agility")
    await user.click(screen.getByRole("button", { name: "Přidat" }))

    await waitFor(() => expect(onAddDiscipline).toHaveBeenCalledWith("Agility"))

    await user.type(screen.getByLabelText("Název cíle"), "Slalom")
    await user.click(screen.getByRole("button", { name: "Uložit" }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        { title: "Slalom", discipline: "Agility", principle: "" },
        expect.anything(),
      )
    })
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

  it("opens a goal without discipline with no discipline selected", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <GoalForm
        disciplines={["Poslušnost", "Canicross"]}
        defaultValues={{ title: "Chůze", discipline: "", principle: "" }}
        isPending={false}
        onSubmit={onSubmit}
      />,
    )

    expect(screen.getByRole("combobox")).toHaveTextContent("Bez disciplíny")

    await user.click(screen.getByRole("button", { name: "Uložit" }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        { title: "Chůze", discipline: "", principle: "" },
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

  it("lets the user clear the discipline", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    // jsdom lacks the pointer-capture and scroll APIs Radix Select calls on open.
    Element.prototype.hasPointerCapture = () => false
    Element.prototype.setPointerCapture = vi.fn()
    Element.prototype.releasePointerCapture = vi.fn()
    Element.prototype.scrollIntoView = vi.fn()
    render(
      <GoalForm
        disciplines={["Poslušnost", "Canicross"]}
        defaultValues={{ title: "Chůze", discipline: "Canicross", principle: "" }}
        isPending={false}
        onSubmit={onSubmit}
      />,
    )

    await user.click(screen.getByRole("combobox"))
    await user.click(await screen.findByRole("option", { name: "Bez disciplíny" }))
    await user.click(screen.getByRole("button", { name: "Uložit" }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        { title: "Chůze", discipline: "", principle: "" },
        expect.anything(),
      )
    })
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
