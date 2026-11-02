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
import { formatDayLong } from "@/lib/calendarDate"

import type { WeekTraining } from "@/features/week/api/weekQueryOptions"
import { useSkipTraining } from "@/features/week/hooks/useSkipTraining"

type SkipTrainingDialogProps = {
  training: WeekTraining
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

// "Přeskočit trénink?" (#75). A skip can be taken back, so the confirmation
// says how, and the action is not styled as destructive.
export function SkipTrainingDialog({ training, isOpen, onOpenChange }: SkipTrainingDialogProps) {
  const skipTraining = useSkipTraining(training.id)

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Přeskočit trénink?</AlertDialogTitle>
          <AlertDialogDescription>
            {training.dog.name} · {training.goal.title}, {formatDayLong(training.date)} Trénink
            zůstane v Týdnu jako přeskočený a plán cíle se neposune. Vrátit to můžete do konce
            týdne.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="min-h-11">Ponechat</AlertDialogCancel>
          <AlertDialogAction
            className="min-h-11"
            disabled={skipTraining.isPending}
            onClick={() => skipTraining.mutate()}
          >
            Přeskočit
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
