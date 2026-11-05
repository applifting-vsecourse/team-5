import type { ReactNode } from "react"
import { Trash2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type ConfirmDestructiveDialogProps = {
  title: string
  description: ReactNode
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  trigger: ReactNode
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * Irreversible-action confirmation (Figma Smazat psa pattern).
 *
 * Callers: account.tsx delete-account flow; dog/step delete in later tickets;
 * docs/ui-components.md. Schemas: none — pure UI; parent passes onConfirm.
 * No existing ConfirmDestructive* (AlertDialog is the primitive only).
 * User: "vem si nejaky redesign issue z baclogu tohohle sprintu a zacni na nem delat".
 */
export function ConfirmDestructiveDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = "Zrušit",
  onConfirm,
  trigger,
  isOpen,
  onOpenChange,
}: ConfirmDestructiveDialogProps) {
  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-danger-surface text-danger-foreground">
            <Trash2 aria-hidden />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
