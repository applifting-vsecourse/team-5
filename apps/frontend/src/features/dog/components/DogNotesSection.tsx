import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import { cs } from "date-fns/locale"
import { NotebookPen, Pencil, Plus, Trash2 } from "lucide-react"

import { ConfirmDestructiveDialog } from "@/components/ConfirmDestructiveDialog"
import { EmptyState } from "@/components/EmptyState"
import { QueryState } from "@/components/QueryState"
import { StripCard } from "@/components/StripCard"
import { Button } from "@/components/ui/button"

import type { DogNoteFormValues } from "@/features/dog/api/dogSchemas"
import { dogNotesQueryOptions } from "@/features/dog/api/dogsQueryOptions"
import { useCreateDogNote } from "@/features/dog/hooks/useCreateDogNote"
import { useDeleteDogNote } from "@/features/dog/hooks/useDeleteDogNote"
import { useUpdateDogNote } from "@/features/dog/hooks/useUpdateDogNote"

import { DogNoteDialog, type DogNoteDialogMode } from "./DogNoteDialog"

type DogNotesSectionProps = {
  dogId: string
  dogName: string
}

const formatNoteDate = (date: string): string =>
  format(parseISO(date), "d. M. yyyy", { locale: cs })

export function DogNotesSection({ dogId, dogName }: DogNotesSectionProps) {
  const [dialogMode, setDialogMode] = useState<DogNoteDialogMode | null>(null)

  const notesQuery = useQuery(dogNotesQueryOptions(dogId))
  const createNote = useCreateDogNote(dogId)
  const updateNote = useUpdateDogNote(dogId)
  const deleteNote = useDeleteDogNote(dogId)

  const notes = notesQuery.data ?? []

  const handleSave = async (values: DogNoteFormValues) => {
    try {
      if (dialogMode?.kind === "edit") {
        await updateNote.mutateAsync({ noteId: dialogMode.note.id, values })
      } else {
        await createNote.mutateAsync(values)
      }
      setDialogMode(null)
    } catch {
      // The hook already told the user; keep the dialog open.
    }
  }

  return (
    <section
      className="space-y-3"
      aria-labelledby="notes-heading"
    >
      <div className="flex items-center justify-between gap-4">
        <h2
          id="notes-heading"
          className="text-section font-extrabold text-foreground"
        >
          Deník
        </h2>
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
      </div>

      <p className="text-sm text-muted-foreground">
        Co zaznělo na lekci nebo semináři. Vidíte jen vy.
      </p>

      <QueryState
        isLoading={notesQuery.isLoading}
        error={
          notesQuery.isError ? (notesQuery.error ?? new Error("Deník se nepodařilo načíst.")) : null
        }
        isEmpty={!notesQuery.isLoading && !notesQuery.isError && notes.length === 0}
        onRetry={() => void notesQuery.refetch()}
        loadingLabel="Načítání deníku"
        errorTitle="Deník se nepodařilo načíst"
        errorDescription="Zkontroluj připojení a zkus to znovu."
        empty={
          <EmptyState
            icon={NotebookPen}
            chip="BEZ POZNÁMEK"
            titleAs="p"
            title={`${dogName} zatím nemá žádnou poznámku`}
            description="Zapište si, co zaznělo na lekci nebo semináři."
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
            >
              <div className="flex items-start gap-2 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {formatNoteDate(note.date)}
                  </p>
                  <p className="truncate text-base font-medium text-foreground">{note.title}</p>
                  <p className="mt-1 line-clamp-3 text-sm whitespace-pre-wrap text-muted-foreground">
                    {note.text}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
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

      <DogNoteDialog
        mode={dialogMode}
        onClose={() => setDialogMode(null)}
        isPending={createNote.isPending || updateNote.isPending}
        onSubmit={handleSave}
      />
    </section>
  )
}
