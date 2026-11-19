import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import { cs } from "date-fns/locale"
import { Lock, NotebookPen, Pencil, Pin, PinOff, Plus, Trash2 } from "lucide-react"

import { ConfirmDestructiveDialog } from "@/components/ConfirmDestructiveDialog"
import { EmptyState } from "@/components/EmptyState"
import { QueryState } from "@/components/QueryState"
import { StripCard } from "@/components/StripCard"
import { Button } from "@/components/ui/button"
import {
  trainerNotesQueryOptions,
  useCreateTrainerNote,
  useDeleteTrainerNote,
  useTogglePinTrainerNote,
  useUpdateTrainerNote,
  type TrainerNoteDog,
  type TrainerNoteFormValues,
} from "@/lib/trainerNotes"
import { cn } from "@/lib/utils"

import { TrainerNoteDialog, type TrainerNoteDialogMode } from "./TrainerNoteDialog"

type TrainerNotesSectionProps = {
  clientId: string
  dogs?: TrainerNoteDog[]
  lockedDog?: TrainerNoteDog
}

const formatNoteDate = (date: string): string =>
  format(parseISO(date), "d. M. yyyy", { locale: cs })

export function TrainerNotesSection({ clientId, dogs = [], lockedDog }: TrainerNotesSectionProps) {
  const [dialogMode, setDialogMode] = useState<TrainerNoteDialogMode | null>(null)

  const notesQuery = useQuery(trainerNotesQueryOptions(clientId, lockedDog?.id))
  const createNote = useCreateTrainerNote(clientId)
  const updateNote = useUpdateTrainerNote(clientId)
  const togglePin = useTogglePinTrainerNote(clientId)
  const deleteNote = useDeleteTrainerNote(clientId)

  const notes = notesQuery.data ?? []
  const headingId = lockedDog ? `trainer-notes-heading-${lockedDog.id}` : "trainer-notes-heading"

  const handleSave = async (values: TrainerNoteFormValues) => {
    try {
      if (dialogMode?.kind === "edit") {
        await updateNote.mutateAsync({ noteId: dialogMode.note.id, values })
      } else {
        await createNote.mutateAsync(values)
      }
      setDialogMode(null)
    } catch {
      // The hook already informed the user; keep the dialog open.
    }
  }

  return (
    <section
      className="space-y-3"
      aria-labelledby={headingId}
    >
      <div className="flex items-center justify-between gap-4">
        <h2
          id={headingId}
          className="text-section font-extrabold text-foreground"
        >
          Moje poznámky
        </h2>
        {notes.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11 min-w-11 gap-2"
            onClick={() => setDialogMode({ kind: "create" })}
          >
            <Plus
              className="size-4"
              aria-hidden
            />
            <span>Nová poznámka</span>
          </Button>
        )}
      </div>

      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Lock
          className="size-3.5 shrink-0"
          aria-hidden
        />
        <span>Soukromé poznámky trenéra · klient ani jiný trenér je nevidí</span>
      </p>

      <QueryState
        isLoading={notesQuery.isLoading}
        error={
          notesQuery.isError
            ? (notesQuery.error ?? new Error("Poznámky se nepodařilo načíst."))
            : null
        }
        isEmpty={!notesQuery.isLoading && !notesQuery.isError && notes.length === 0}
        onRetry={() => void notesQuery.refetch()}
        loadingLabel="Načítání poznámek"
        errorTitle="Poznámky se nepodařilo načíst"
        errorDescription="Zkontrolujte připojení a zkuste to znovu."
        empty={
          <EmptyState
            icon={NotebookPen}
            chip="SOUKROMÉ POZNÁMKY"
            titleAs="p"
            title={
              lockedDog
                ? `Zatím žádné poznámky ke psu ${lockedDog.name}`
                : "Zatím nemáte žádnou poznámku"
            }
            description="Zapište si postřehy z lekce, citlivosti psa nebo na co navázat příště. Klient poznámky nevidí."
            action={
              <Button
                type="button"
                size="lg"
                className="w-full"
                onClick={() => setDialogMode({ kind: "create" })}
              >
                <Plus
                  className="size-4"
                  aria-hidden
                />
                Nová poznámka
              </Button>
            }
          />
        }
      >
        <ul className="flex flex-col gap-2">
          {notes.map((note) => (
            <StripCard
              key={note.id}
              as="li"
              dogColor={note.dog?.color}
              className={cn(note.isPinned && "border-primary/40 bg-accent/40")}
            >
              <div className="flex items-start gap-2 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <span>{formatNoteDate(note.date)}</span>
                    {!lockedDog && (
                      <>
                        <span aria-hidden>·</span>
                        <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold text-secondary-foreground">
                          {note.dog ? note.dog.name : "Obecné"}
                        </span>
                      </>
                    )}
                    {note.isPinned && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 font-bold text-primary">
                        <Pin
                          className="size-3"
                          aria-hidden
                        />
                        Připnuto
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-base font-medium text-foreground">
                    {note.title}
                  </p>
                  <p className="mt-1 line-clamp-3 text-sm whitespace-pre-wrap text-muted-foreground">
                    {note.text}
                  </p>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn("size-11", note.isPinned && "text-primary")}
                    aria-label={
                      note.isPinned
                        ? `Odepnout poznámku ${note.title}`
                        : `Připnout poznámku ${note.title}`
                    }
                    aria-pressed={note.isPinned}
                    disabled={togglePin.isPending}
                    onClick={() => togglePin.mutate({ noteId: note.id, isPinned: !note.isPinned })}
                  >
                    {note.isPinned ? (
                      <PinOff
                        className="size-5"
                        aria-hidden
                      />
                    ) : (
                      <Pin
                        className="size-5"
                        aria-hidden
                      />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11"
                    aria-label={`Upravit poznámku ${note.title}`}
                    onClick={() => setDialogMode({ kind: "edit", note })}
                  >
                    <Pencil
                      className="size-5"
                      aria-hidden
                    />
                  </Button>
                  <ConfirmDestructiveDialog
                    title="Smazat poznámku?"
                    description={`Poznámka „${note.title}“ zmizí. Vrátit to nepůjde.`}
                    confirmLabel="Smazat"
                    cancelLabel="Ponechat"
                    onConfirm={() => deleteNote.mutate(note.id)}
                    trigger={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-11 text-destructive hover:text-destructive"
                        aria-label={`Smazat poznámku ${note.title}`}
                      >
                        <Trash2
                          className="size-5"
                          aria-hidden
                        />
                      </Button>
                    }
                  />
                </div>
              </div>
            </StripCard>
          ))}
        </ul>
      </QueryState>

      <TrainerNoteDialog
        mode={dialogMode}
        dogs={dogs}
        lockedDog={lockedDog}
        onClose={() => setDialogMode(null)}
        isPending={createNote.isPending || updateNote.isPending}
        onSubmit={handleSave}
      />
    </section>
  )
}
