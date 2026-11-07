import { useRef, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api-client"
import { todayCalendarDate } from "@/lib/calendarDate"
import { dogKeys } from "@/lib/dogKeys"
import { weekKeys } from "@/lib/weekKeys"

type DogOption = { id: string; name: string }

function FreeTrainingForm({ dogs, onSaved }: { dogs: DogOption[]; onSaved: () => void }) {
  const client = useQueryClient()
  const locked = useRef(false)
  const [dogId, setDogId] = useState(dogs[0]?.id ?? "")
  const [title, setTitle] = useState("")
  const [date, setDate] = useState(todayCalendarDate())
  const [rate, setRate] = useState("")
  const [note, setNote] = useState("")
  const save = useMutation({
    mutationFn: () =>
      api.post(`dogs/${dogId}/activities`, {
        json: {
          title: title.trim(),
          completedAt: new Date(`${date}T12:00:00`).toISOString(),
          ...(rate !== "" ? { successRate: Number(rate) } : {}),
          ...(note.trim() ? { note: note.trim() } : {}),
        },
      }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: dogKeys.all }),
        client.invalidateQueries({ queryKey: weekKeys.all }),
      ])
      toast.success("Trénink je zapsaný.")
      onSaved()
    },
    onSettled: () => {
      locked.current = false
    },
  })
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!dogId || !title.trim() || !date || date > todayCalendarDate() || locked.current) return
        locked.current = true
        save.mutate()
      }}
    >
      <fieldset
        disabled={save.isPending}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="free-training-dog">Pes</Label>
          <Select
            value={dogId}
            onValueChange={setDogId}
          >
            <SelectTrigger
              id="free-training-dog"
              className="w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dogs.map((dog) => (
                <SelectItem
                  key={dog.id}
                  value={dog.id}
                >
                  {dog.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="free-training-title">Název tréninku</Label>
          <Input
            id="free-training-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={120}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="free-training-date">Datum</Label>
          <Input
            id="free-training-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            max={todayCalendarDate()}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="free-training-rate">Úspěšnost v % (volitelné)</Label>
          <Input
            id="free-training-rate"
            type="number"
            min={0}
            max={100}
            step={1}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="free-training-note">Poznámka (volitelné)</Label>
          <Textarea
            id="free-training-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={2000}
          />
        </div>
        {save.isError && (
          <p
            role="alert"
            className="text-sm text-destructive"
          >
            {save.error.message || "Trénink se nepodařilo uložit. Zkus to znovu."}
          </p>
        )}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!dogId || !title.trim()}
        >
          {save.isPending ? "Ukládám…" : "Zapsat trénink"}
        </Button>
      </fieldset>
    </form>
  )
}

export function LogFreeTrainingDialog({ dogs }: { dogs: DogOption[] }) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => setOpen(value)}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="hidden rounded-field xl:inline-flex"
          disabled={!dogs.length}
        >
          <Plus />
          Zapsat volný trénink
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle>Zapsat volný trénink</DialogTitle>
          <DialogDescription>
            Trénink mimo plán se uloží do historie psa a započítá do jeho metrik.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <FreeTrainingForm
            dogs={dogs}
            onSaved={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
