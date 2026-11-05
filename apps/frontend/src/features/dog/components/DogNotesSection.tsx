import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import { cs } from "date-fns/locale"
import { NotebookPen, Pencil, Plus, Trash2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import type { DogNote, DogNoteFormValues } from "@/features/dog/api/dogSchemas"
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
  const [noteToDelete, setNoteToDelete] = useState<DogNote | null>(null)

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

  const handleConfirmDelete = () => {
    if (!noteToDelete) return
    deleteNote.mutate(noteToDelete.id)
    setNoteToDelete(null)
  }

  return (
    <section
      className="space-y-3"
      aria-labelledby="notes-heading"
    >
      <div className="flex items-center justify-between gap-4">
        <h2
          id="notes-heading"
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          Poznámky
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11 min-w-11 gap-2"
          onClick={() => setDialogMode({ kind: "create" })}
        >
          <Plus className="size-4" />
          <span>Nová poznámka</span>
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Co zaznělo na lekci nebo semináři. Vidíte jen vy.
      </p>

      {notesQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      ) : notesQuery.error ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Poznámky se nepodařilo načíst.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11"
            onClick={() => void notesQuery.refetch()}
          >
            Zkusit znovu
          </Button>
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center">
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <NotebookPen className="size-5" />
          </div>
          <p className="text-sm text-muted-foreground">
            {dogName} zatím nemá žádnou poznámku. Zapište si, co zaznělo na lekci.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-lg border border-border bg-card p-3"
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{formatNoteDate(note.date)}</p>
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
                    <Pencil className="size-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11 text-destructive hover:text-destructive"
                    aria-label={`Smazat poznámku ${note.title}`}
                    onClick={() => setNoteToDelete(note)}
                  >
                    <Trash2 className="size-5" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <DogNoteDialog
        mode={dialogMode}
        onClose={() => setDialogMode(null)}
        isPending={createNote.isPending || updateNote.isPending}
        onSubmit={handleSave}
      />

      <AlertDialog
        open={noteToDelete !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setNoteToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat poznámku?</AlertDialogTitle>
            <AlertDialogDescription>
              Poznámka „{noteToDelete?.title}“ zmizí. Vrátit to nepůjde.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">Ponechat</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="min-h-11"
              onClick={handleConfirmDelete}
            >
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
